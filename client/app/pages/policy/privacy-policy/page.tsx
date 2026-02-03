
import React from "react";

const Page = () => {
    return (
        <>
            

            <section className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
                <h1 className="text-3xl font-bold text-teal-600 mb-4">Privacy Policy</h1>
                <p className="mb-4">
                    At <strong>Dr. Rajneesh Kant Clinic</strong>, your privacy is our priority. Located in Mumbai, we are a top-rated establishment in the field of Orthopedic care, servicing patients both locally and from other parts of the city.
                </p>

                <p className="mb-4">
                    We offer comprehensive medical services including appointment booking, patient profile creation, medical record management, and secure online payment integration — all through our website. Our goal is to ensure a seamless and secure user experience.
                </p>

                <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">Why Patients Trust Us</h2>
                <ul className="list-disc list-inside space-y-2">
                    <li>Experienced orthopedic and osteopathic doctors</li>
                    <li>Advanced physiotherapy and manual therapy equipment</li>
                    <li>Certified professional therapists</li>
                    <li>Friendly and compassionate staff</li>
                    <li>Affordable services with guaranteed healing</li>
                    <li>Home visits available through on-call therapist</li>
                </ul>

                <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">Information We Collect</h2>
                <p className="mb-4">
                    We collect personal and medical information during user registration, appointment booking, and payment processing to ensure smooth communication and treatment.
                </p>

                <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>To manage patient bookings and appointment schedules</li>
                    <li>To securely store medical histories and treatment records</li>
                    <li>To process payments through encrypted channels</li>
                    <li>To send appointment reminders and medical updates</li>
                </ul>

                <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">Data Protection & Security</h2>
                <p className="mb-4">
                    Your data is stored securely and handled in compliance with industry standards. We implement strict access controls, encryption, and privacy protocols.
                </p>

                <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">Your Rights</h2>
                <p className="mb-4">
                    You have full rights to request access, updates, or deletion of your personal data by contacting our support team.
                </p>

                <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">Contact Us</h2>
                <p>
                    For any concerns regarding your privacy or to learn more about our data practices, please contact us at <a href="mailto:support@drkantclinic.in" className="text-blue-600 underline">support@drkantclinic.in</a>.
                </p>

                <p className="mt-8 text-sm text-gray-500">
                    Last updated: June 2025
                </p>
            </section>
        </>
    );
};

export default Page;
