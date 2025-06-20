
import React from 'react';

const Page = () => {
    return (
        <section className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
            <h1 className="text-3xl font-bold text-teal-600 mb-4">Refund Policy</h1>

            <p className="mb-4">
                At <strong>Dr. Rajneesh Kant Clinic</strong>, we are committed to delivering exceptional healthcare services. We understand that situations may arise where a refund is required, and we aim to handle such requests with transparency and care.
            </p>

            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">Eligibility for Refund</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
                <li>If the appointment is cancelled by the clinic.</li>
                <li>If the service is not delivered as promised due to a technical error.</li>
                <li>If a duplicate payment was made by mistake.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">Non-Refundable Cases</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Once the consultation or service has been availed.</li>
                <li>If the patient does not attend the appointment without prior notice.</li>
                <li>For payments made for home visit bookings unless cancelled within a valid timeframe.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">Refund Process</h2>
            <p className="mb-4">
                {`If your refund is approved, the amount will be processed back to your original payment method within 5–7 business days. You'll receive a confirmation via email or SMS once the refund is initiated.`}
            </p>

            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">How to Request a Refund</h2>
            <p className="mb-4">
                Please email us at <a href="mailto:support@drkantclinic.in" className="text-blue-600 underline">support@drkantclinic.in</a> or call our clinic directly. Include your booking ID, payment reference, and the reason for your refund request.
            </p>

            <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">Need Help?</h2>
            <p>
                If you have any further questions, don’t hesitate to contact our support team. We’re here to help you at every step.
            </p>

            <p className="mt-8 text-sm text-gray-500">
                Last updated: June 2025
            </p>
        </section>
    );
};

export default Page;
