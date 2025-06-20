
import React from 'react';

const Page = () => {
    return (
        <section className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
            <h1 className="text-3xl font-bold text-teal-600 mb-6">Terms and Conditions</h1>

            <p className="mb-4">
                Welcome to <strong>Dr. Rajneesh Kant Clinic</strong>. These terms and conditions outline the rules and regulations for the use of our services, both online and offline. By accessing this website or booking services through our platform, you agree to accept all terms and conditions stated here.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-3">1. Booking & Appointments</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Appointments can be booked through our website, app, or by phone.</li>
                <li>Appointments are confirmed only after payment is successfully processed.</li>
                <li>In case of cancellation, please refer to our <a href="/refund-policy" className="text-blue-600 underline">Refund Policy</a>.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-3">2. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
                <li>You agree to provide accurate information during registration and booking.</li>
                <li>Respect the time slots booked and arrive on time for consultations.</li>
                <li>Avoid misuse of the services or abusive behavior toward staff.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-3">3. Payments</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
                <li>All payments must be completed before availing of the service.</li>
                <li>We accept UPI, credit/debit cards, and net banking.</li>
                <li>Payment gateways used are secure and encrypted.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-3">4. Privacy</h2>
            <p className="mb-4">
                Your data is safe with us. Please refer to our <a href="/privacy-policy" className="text-blue-600 underline">Privacy Policy</a> for more information on how we collect and use your data.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-3">5. Modification of Terms</h2>
            <p className="mb-4">
                We reserve the right to modify these terms at any time. Continued use of the services after such changes shall constitute your consent to the updated terms.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-3">6. Contact Us</h2>
            <p>
                If you have any questions or concerns regarding these terms, feel free to contact us at:
                <br />
                📧 <a href="mailto:support@drkantclinic.in" className="text-blue-600 underline">support@drkantclinic.in</a>
                <br />
                📞 +91-XXXXXXXXXX
            </p>

            <p className="mt-8 text-sm text-gray-500">Last updated: June 2025</p>
        </section>
    );
};

export default Page;
