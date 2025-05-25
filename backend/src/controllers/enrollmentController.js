const Course = require('../models/Course');
const User = require('../models/User');
const paypal = require('paypal-rest-sdk');

// Configure PayPal
paypal.configure({
    'mode': process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'secret': process.env.PAYPAL_SECRET
});

// Enroll a student in a course
exports.enrollStudent = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id; // Assuming user is attached to req by auth middleware

        // Find the course and the student
        const course = await Course.findById(courseId);
        const student = await User.findById(studentId);

        if (!course || !student) {
            return res.status(404).json({ message: 'Course or student not found' });
        }

        // Check if the student is already enrolled
        if (course.enrolledStudents.includes(studentId)) {
            return res.status(400).json({ message: 'Student already enrolled in this course' });
        }

        // For free courses, directly enroll
        if (course.price === 0) {
             // Add the student to the course's enrolledStudents list
            course.enrolledStudents.push(studentId);
            await course.save();

            // Add the course to the student's enrolledCourses list
            student.enrolledCourses.push(courseId);
            await student.save();

            return res.json({ message: 'Enrollment successful', course });
        } else {
             // For paid courses, proceed with payment (handled by frontend after creating order)
             // This endpoint is now primarily for free enrollment.
             // The paid enrollment flow starts with createPaypalOrder.
             return res.status(400).json({ message: 'This is a paid course, please use the PayPal payment flow.' });
        }


    } catch (error) {
        res.status(500).json({ message: 'Error enrolling student', error: error.message });
    }
};

// Check if a student is enrolled in a course
exports.checkEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id; // Assuming user is attached to req by auth middleware

        // Find the course and check if the student is in the enrolledStudents list
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const isEnrolled = course.enrolledStudents.includes(studentId);

        res.json({ isEnrolled });
    } catch (error) {
        res.status(500).json({ message: 'Error checking enrollment', error: error.message });
    }
};

// Create a PayPal order
exports.createPaypalOrder = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id;

        // Find the course
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.price <= 0) {
             return res.status(400).json({ message: 'This is a free course, no payment needed.' });
        }

        // Check if the student is already enrolled
        if (course.enrolledStudents.includes(studentId)) {
            return res.status(400).json({ message: 'Student already enrolled in this course' });
        }

        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                // These should point to your frontend's success and cancel pages
                "return_url": `${process.env.CLIENT_URL}/payment/${courseId}/success`,
                "cancel_url": `${process.env.CLIENT_URL}/payment/${courseId}/cancel`
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": course.title,
                        "sku": course._id, // Use course ID as SKU
                        "price": course.price.toFixed(2), // Ensure price is a string with 2 decimal places
                        "currency": "USD", // Or your preferred currency
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD", // Or your preferred currency
                    "total": course.price.toFixed(2) // Ensure total is a string with 2 decimal places
                },
                "description": `Enrollment for course: ${course.title}`
            }]
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                console.error("PayPal create payment error:", error.response);
                res.status(500).json({ message: 'Error creating PayPal payment', error: error.response });
            } else {
                // Find the approval URL to send to the frontend
                for(let i = 0; i < payment.links.length; i++){
                    if(payment.links[i].rel === 'approval_url'){
                        res.json({ approvalUrl: payment.links[i].href });
                        break;
                    }
                }
            }
        });

    } catch (error) {
        console.error("Server error creating PayPal order:", error);
        res.status(500).json({ message: 'Server error creating PayPal order', error: error.message });
    }
};

// Capture (Execute) the PayPal order after user approval
exports.capturePaypalOrder = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id;
        const { paymentId, PayerID } = req.body; // Get paymentId and PayerID from frontend

        if (!paymentId || !PayerID) {
            return res.status(400).json({ message: 'Missing paymentId or PayerID' });
        }

        // Find the course and the student
        const course = await Course.findById(courseId);
        const student = await User.findById(studentId);

         if (!course || !student) {
            return res.status(404).json({ message: 'Course or student not found' });
        }

         // Check if the student is already enrolled (prevent double enrollment)
        if (course.enrolledStudents.includes(studentId)) {
            return res.status(400).json({ message: 'Student already enrolled in this course' });
        }

        paypal.payment.execute(paymentId, { 'payer_id': PayerID }, async function (error, payment) {
            if (error) {
                console.error("PayPal execute payment error:", error.response);
                res.status(500).json({ message: 'Error executing PayPal payment', error: error.response });
            } else {
                // Check if payment was successful
                if (payment.state === 'approved') {
                    // Enroll the student in the course
                    course.enrolledStudents.push(studentId);
                    await course.save();

                    student.enrolledCourses.push(courseId);
                    await student.save();

                    res.json({ message: 'Payment successful and student enrolled', course, payment });
                } else {
                    res.status(400).json({ message: 'Payment not approved', payment });
                }
            }
        });

    } catch (error) {
        console.error("Server error capturing PayPal order:", error);
        res.status(500).json({ message: 'Server error capturing PayPal order', error: error.message });
    }
};

// Optional: Unenroll a student from a course
// exports.unenrollStudent = async (req, res) => { ... }; 