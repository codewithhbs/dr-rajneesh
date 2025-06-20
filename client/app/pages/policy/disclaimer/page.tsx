"use client";

import React from 'react';

const Disclaimer = () => {
    return (
        <section className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
            <h1 className="text-3xl font-bold text-teal-600 mb-6">Disclaimer</h1>

            <p className="mb-4">
                The information provided on this website by <strong>Dr. Rajneesh Kant Clinic</strong> is for general informational purposes only. All content, including text, graphics, images, and other materials, is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-3">1. Medical Advice Disclaimer</h2>
            <p className="mb-4">
                The content shared on this site does not constitute medical advice and should not be relied upon as such. Always consult your physician or a qualified health provider regarding any medical condition.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-3">2. No Doctor-Patient Relationship</h2>
            <p className="mb-4">
                Visiting this website, filling out forms, or scheduling appointments online does not create a doctor-patient relationship. That relationship is established only upon direct consultation at the clinic.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-3">3. External Links</h2>
            <p className="mb-4">
                This website may contain links to third-party websites. We do not assume responsibility for the accuracy or reliability of any information offered by third-party websites linked through our platform.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-3">4. Limitation of Liability</h2>
            <p className="mb-4">
                While we strive to keep the information on this site accurate and up-to-date, we make no guarantees of any kind. We are not liable for any losses or damages arising from the use of this website.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-3">5. Changes to This Disclaimer</h2>
            <p className="mb-4">
                We reserve the right to update or change this disclaimer at any time. It is your responsibility to review this page periodically for updates.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-3">Contact Us</h2>
            <p>
                If you have any questions about this disclaimer, you can contact us at:
                <br />
                📧 <a href="mailto:support@drkantclinic.in" className="text-blue-600 underline">support@drkantclinic.in</a>
                <br />
                📞 +91-XXXXXXXXXX
            </p>

            <p className="mt-8 text-sm text-gray-500">Last updated: June 2025</p>
        </section>
    );
};

export default Disclaimer;
