import React from "react";

const Page = () => {
    return (
        <section className="max-w-4xl mx-auto px-4 py-8 text-gray-800 space-y-8">

            <h1 className="text-3xl font-bold text-teal-600 mb-4">
                Refund Policy
            </h1>

            <p>
                At <strong>Dr. Rajneesh Kant Clinic</strong>, we are committed to delivering exceptional healthcare services.
                We understand that situations may arise where a refund is required, and we aim to handle such requests with transparency and care.
            </p>

            {/* Eligibility */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                    Eligibility for Refund
                </h2>

                <ul className="list-disc list-inside space-y-2">
                    <li>If the appointment is cancelled by the clinic.</li>
                    <li>If the service is not delivered as promised due to a technical error.</li>
                    <li>If a duplicate payment was made by mistake.</li>
                </ul>
            </div>

            {/* Non Refundable */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                    Non-Refundable Cases
                </h2>

                <ul className="list-disc list-inside space-y-2">
                    <li>Once the consultation or service has been availed.</li>
                    <li>
                        if the patient is unable to make it for the appointment they can reschedule for our next visit date is one of the option which is valid for one month only.
                    </li>
                    <li>
                        For payments made for home visit bookings unless cancelled within a valid timeframe.
                    </li>
                </ul>
            </div>

            {/* Section 2 */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    2. Official Payment URLs
                </h2>

                <p className="mb-4">
                    Payments must only be made through official company-approved URLs.
                    The company will communicate its authorized payment links through the following channels:
                </p>

                <ul className="list-disc pl-6 space-y-2">
                    <li>Official email addresses</li>
                    <li>Verified SMS or WhatsApp communication</li>
                    <li>Printed invoices or receipts</li>
                </ul>

                <p className="mt-4">
                    Users must ensure the URL begins with
                    <span className="font-medium text-gray-900"> https:// </span>
                    and displays a secure padlock symbol in the browser.
                </p>
            </div>

            {/* Section 3 */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    3. Unauthorized URLs
                </h2>

                <p className="mb-4">
                    Dr. Rajneesh Kant Private Limited does not take responsibility for payments made through:
                </p>

                <ul className="list-disc pl-6 space-y-2">
                    <li>Third-party or unknown websites</li>
                    <li>Links shared by unauthorized persons</li>
                    <li>Social media messages not verified by the company</li>
                </ul>

                <p className="mt-4">
                    Users are strongly advised not to click on suspicious or shortened links.
                </p>
            </div>

            {/* Section 4 */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    4. Verification of Payment Links
                </h2>

                <p className="mb-4">
                    Before making any payment, users must take the following precautions to ensure the authenticity of the payment link:
                </p>

                <ul className="list-disc pl-6 space-y-2">
                    <li>Verify the domain name spelling carefully</li>
                    <li>Avoid links containing unusual characters or misspellings</li>
                    <li>Cross-check the link with official company communication</li>
                    <li>Contact the company for confirmation if unsure</li>
                </ul>
            </div>

            {/* Section 5 */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    5. Data Security
                </h2>

                <p className="mb-4">
                    Users should never share sensitive or confidential information such as:
                </p>

                <ul className="list-disc pl-6 space-y-2">
                    <li>OTP (One-Time Password)</li>
                    <li>Banking PINs or passwords</li>
                    <li>Card CVV numbers through calls or messages</li>
                </ul>

                <p className="mt-4">
                    The company will never request confidential banking information outside of secure and authorized payment gateways.
                </p>
            </div>

            {/* Section 6 */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    6. Payment Gateways
                </h2>

                <p className="mb-4">
                    Payments may be processed through trusted third-party payment gateways authorized by the company.
                </p>

                <p>
                    Users must ensure that they are redirected to secure and reputable payment platforms before completing any transaction.
                </p>
            </div>

            {/* Section 7 */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    7. Liability Disclaimer
                </h2>

                <p className="mb-4">
                    The company shall not be liable for:
                </p>

                <ul className="list-disc pl-6 space-y-2">
                    <li>Losses due to payments made on fraudulent or incorrect URLs</li>
                    <li>Unauthorized transactions caused by user negligence</li>
                </ul>

                <p className="mt-4">
                    Users are solely responsible for verifying the authenticity of payment links.
                </p>
            </div>

            {/* Section 8 */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    8. Reporting Suspicious URLs
                </h2>

                <p className="mb-4">
                    If any suspicious or fraudulent URL is encountered, users should:
                </p>

                <ul className="list-disc pl-6 space-y-2">
                    <li>
                        Immediately report it to the company's official contact channels.
                    </li>
                </ul>
            </div>

            {/* Refund Process */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                    Refund Process
                </h2>

                <p>
                    If your refund is approved, the amount will be processed back to your original payment method within 5–7 business days. You'll receive a confirmation via email or SMS once the refund is initiated.
                </p>
            </div>

            {/* Refund Request */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                    How to Request a Refund
                </h2>

                <p>
                    Please email us at{" "}
                    <a
                        href="mailto:support@drkantclinic.in"
                        className="text-blue-600 underline"
                    >
                        support@drkantclinic.in
                    </a>{" "}
                    or call our clinic directly. Include your booking ID, payment reference, and the reason for your refund request.
                </p>
            </div>

            {/* Help */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                    Need Help?
                </h2>

                <p>
                    If you have any further questions, don’t hesitate to contact our support team. We’re here to help you at every step.
                </p>
            </div>

            <p className="text-sm text-gray-500">
                Last updated: June 2025
            </p>

        </section>
    );
};

export default Page;