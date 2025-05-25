import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PaymentPage.module.css'; // We will create this CSS module later

function PaymentPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load PayPal script dynamically
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD`; // Replace with your client ID environment variable
    script.onload = () => setLoading(false);
    script.onerror = () => {
      setError('Failed to load PayPal SDK.');
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      // Clean up the script when component unmounts
      const paypalScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
      if (paypalScript && document.body.contains(paypalScript)) {
        document.body.removeChild(paypalScript);
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && !error && window.paypal) {
      try {
        window.paypal.Buttons({
          createOrder: (data, actions) => createOrder(data, actions),
          onApprove: (data, actions) => onApprove(data, actions),
          onCancel: (data) => {
            console.log('Payment cancelled', data);
            setError('Payment cancelled by user.');
          },
          onError: (err) => {
            console.error('PayPal button error', err);
            setError('A PayPal error occurred. Please try again.');
          }
        }).render('#paypal-button-container');
        console.log('PayPal buttons rendered.');
      } catch (renderErr) {
        console.error('Failed to render PayPal buttons:', renderErr);
        setError('Failed to render PayPal buttons.');
      }
    }
  }, [loading, error, createOrder, onApprove]);

  const createOrder = async (data, actions) => {
    // Call backend to create a PayPal order
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`/api/enrollment/${courseId}/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const orderData = await response.json();

      if (!response.ok) {
        // Handle errors from the backend (e.g., course not found, already enrolled)
         console.error('Error creating PayPal order:', orderData.message);
         setError(orderData.message || 'Could not create PayPal order.');
        return actions.reject(new Error(orderData.message || 'Could not create PayPal order.'));
      }

      console.log('PayPal order created:', orderData.orderId);
      return orderData.orderId;

    } catch (error) {
      console.error('Fetch error creating PayPal order:', error);
      setError(error.message || 'An error occurred while creating the order.');
      return actions.reject(error);
    }
  };

  const onApprove = async (data, actions) => {
    // Call backend to capture the payment
     try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`/api/enrollment/${courseId}/paypal/capture-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: data.orderID
          })
        });

        const captureData = await response.json();

        if (!response.ok) {
          console.error('Error capturing PayPal payment:', captureData.message);
          setError(captureData.message || 'Could not capture PayPal payment.');
           throw new Error(captureData.message || 'Could not capture PayPal payment.');
        }

        // Payment successful, redirect or show success message
        console.log('Payment successful!', captureData);
         navigate(`/course/${courseId}`, { state: { paymentSuccess: true } }); // Redirect to course detail page

      } catch (error) {
         console.error('Fetch error capturing PayPal payment:', error);
         setError(error.message || 'An error occurred while capturing the payment.');
         // Do not re-throw here, let PayPal's SDK handle potential errors after approval
      }
  };

  return (
    <div className={styles.paymentContainer}>
      <h2>Payment Information</h2>
      <p>Please complete your payment to enroll in the course.</p>
      
      {/* 
        TODO: Integrate with your chosen payment gateway (Stripe, PayPal, etc.) here.
        This might involve:
        - Initializing the payment gateway SDK.
        - Displaying payment elements (card forms, PayPal buttons).
        - Confirming the payment on the client-side after user interaction.
        - Handling payment success or failure and notifying your backend.
      */}
      
      {/* Example: Placeholder for payment form/button */}
      <div className={styles.paymentFormPlaceholder}>
        {/* Payment Gateway UI Elements Go Here */}
        <p>[Payment Form or Button]</p>
      </div>

      {loading && <p>Loading PayPal...</p>}
      {error && <p className={styles.errorMessage}>Error: {error}</p>}

      {!loading && !error && (
        <div className={styles.paypalButtonContainer}>
          {/* PayPal buttons will render here */}
           <div id="paypal-button-container"></div>
        </div>
      )}

    </div>
  );
}

export default PaymentPage; 