import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link to="/">
            <Button variant="ghost" className="mb-4 text-amber-50 hover:text-amber-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="gradient-heading text-4xl md:text-5xl font-bold mb-4">
            🔐 Privacy Policy
          </h1>
          <p className="text-amber-100/80 text-lg">
            Effective Date: 24/07/2025 | Last Updated: 12/06/2025
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card rounded-2xl p-8 space-y-8"
        >
          <div className="space-y-6">
            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                1. Introduction
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                Welcome to AmbitiousCare.co ("we", "us", "our"). This Privacy Policy outlines how we
                collect, use, disclose, and protect your personal data when you use our website, services,
                and platform.
              </p>
              <p className="text-amber-50/90 leading-relaxed mt-4">
                We are committed to safeguarding the privacy and personal data of our users — especially
                the blue-collar workers and professional experts who trust us to connect them through our
                holistic support ecosystem.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                2. Who We Are
              </h2>
              <div className="glass rounded-lg p-4">
                <p className="text-amber-50/90">
                  <strong className="text-amber-100">AmbitiousCare Ltd</strong>
                </p>
                <p className="text-amber-50/90 mt-2">
                  <strong className="text-amber-100">Registered in the United Kingdom</strong>
                </p>
                <p className="text-amber-50/90 mt-2">
                  <strong className="text-amber-100">Email:</strong>{" "}
                  <a 
                    href="mailto:contact@ambitiouscare.co" 
                    className="text-amber-200 hover:text-amber-100 underline transition-colors"
                  >
                    contact@ambitiouscare.co
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                3. How We Use Your Data
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                We use your data to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li>Create and manage user and expert profiles</li>
                <li>Facilitate appointment bookings and communication</li>
                <li>Process payments securely via trusted third-party providers</li>
                <li>Send email and SMS notifications (appointment reminders, updates, etc.)</li>
                <li>Improve platform experience and develop new services</li>
                <li>Comply with legal obligations and protect against fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                4. Legal Basis for Processing
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                We process your personal data based on the following legal grounds:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li><strong className="text-amber-100">Consent:</strong> When you voluntarily submit your data to register or book an appointment</li>
                <li><strong className="text-amber-100">Contract:</strong> When processing is necessary to provide the services you've requested</li>
                <li><strong className="text-amber-100">Legal Obligation:</strong> For recordkeeping, financial compliance, and regulatory duties</li>
                <li><strong className="text-amber-100">Legitimate Interest:</strong> To improve our services, ensure platform security, and support growth</li>
              </ul>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                5. Sharing Your Information
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                We may share your data with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li>Expert Providers (therapists, coaches, consultants) to facilitate booked services</li>
                <li>Payment Processors like Stripe and PayPal</li>
                <li>CRM, scheduling, or email platforms we use for workflow automation</li>
                <li>Law enforcement or regulatory bodies when legally required</li>
              </ul>
              <p className="text-amber-50/90 leading-relaxed mt-4">
                We do not sell or rent your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                6. Data Retention
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                We retain personal data only for as long as necessary to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li>Fulfill the purposes outlined above</li>
                <li>Comply with our legal and financial obligations</li>
                <li>Support dispute resolution and enforce agreements</li>
              </ul>
              <p className="text-amber-50/90 leading-relaxed mt-4">
                After the retention period, data will be securely deleted or anonymized.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                7. Data Security
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li>HTTPS encryption</li>
                <li>Two-factor authentication for admins</li>
                <li>Secure cloud storage</li>
                <li>Regular security audits and access logs</li>
              </ul>
              <p className="text-amber-50/90 leading-relaxed mt-4">
                However, no digital transmission is 100% secure. We encourage users to protect their login
                credentials and notify us of any suspicious activity.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                8. Your Rights (UK GDPR)
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                As a user, you have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion ("right to be forgotten")</li>
                <li>Withdraw consent at any time</li>
                <li>Object to certain processing (e.g. for marketing purposes)</li>
                <li>Lodge a complaint with the Information Commissioner's Office (ICO)</li>
              </ul>
              <p className="text-amber-50/90 leading-relaxed mt-4">
                To exercise any of these rights, email us at{" "}
                <a 
                  href="mailto:contact@ambitiouscare.co" 
                  className="text-amber-200 hover:text-amber-100 underline transition-colors"
                >
                  contact@ambitiouscare.co
                </a>
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                9. Cookies & Tracking
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                We use cookies to personalize content, remember user settings, and analyze site traffic. See
                our{" "}
                <Link to="/cookies-policy" className="text-amber-200 hover:text-amber-100 underline transition-colors">
                  Cookies Policy
                </Link>{" "}
                for more details and opt-out options.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                10. Third-Party Links
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                Our platform may contain links to third-party websites. We are not responsible for their
                privacy practices. We encourage you to read their privacy policies separately.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                11. Children's Data
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                AmbitiousCare.co is not intended for users under the age of 18. We do not knowingly collect
                data from minors.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                12. Changes to This Policy
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                We may update this Privacy Policy as needed to comply with changes in the law or our
                practices. Updated versions will be posted with the "Last Updated" date at the top.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                13. Contact Us
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                For any questions or data-related concerns, please contact:
              </p>
              <div className="mt-4 p-4 glass rounded-lg">
                <p className="text-amber-50/90">
                  <strong className="text-amber-100">AmbitiousCare Ltd</strong>
                </p>
                <p className="text-amber-50/90 mt-2">
                  📩{" "}
                  <a 
                    href="mailto:contact@ambitiouscare.co" 
                    className="text-amber-200 hover:text-amber-100 underline transition-colors"
                  >
                    contact@ambitiouscare.co
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                14. Data Categories
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-amber-900/20">
                  <thead>
                    <tr className="bg-amber-900/10">
                      <th className="border border-amber-900/20 p-3 text-left text-amber-100 font-semibold">Category</th>
                      <th className="border border-amber-900/20 p-3 text-left text-amber-100 font-semibold">Examples</th>
                    </tr>
                  </thead>
                  <tbody className="text-amber-50/90">
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Identity Information</td>
                      <td className="border border-amber-900/20 p-3">Name, email address, phone number, date of birth</td>
                    </tr>
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Employment Info</td>
                      <td className="border border-amber-900/20 p-3">Industry, job title, work history, experience level</td>
                    </tr>
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Communication Data</td>
                      <td className="border border-amber-900/20 p-3">Messages sent via our platform, emails, meeting notes</td>
                    </tr>
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Booking Data</td>
                      <td className="border border-amber-900/20 p-3">Appointment history, scheduling details</td>
                    </tr>
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Financial Data</td>
                      <td className="border border-amber-900/20 p-3">Payment method (via Stripe or PayPal), billing address</td>
                    </tr>
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Usage Data</td>
                      <td className="border border-amber-900/20 p-3">Logins, site activity, feature engagement</td>
                    </tr>
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Device Data</td>
                      <td className="border border-amber-900/20 p-3">IP address, browser type, location, operating system</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 