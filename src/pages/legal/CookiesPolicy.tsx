import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CookiesPolicy = () => {
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
            🍪 Cookies Policy
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
                This Cookies Policy explains how AmbitiousCare Ltd ("AmbitiousCare", "we", "us", or "our") uses cookies
                and similar tracking technologies on our website: https://ambitiouscare.co. This policy should be read in
                conjunction with our Privacy Policy and Terms and Conditions.
              </p>
              <p className="text-amber-50/90 leading-relaxed mt-4">
                By using our website, you agree to our use of cookies as described in this policy.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                2. What Are Cookies?
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                Cookies are small text files stored on your device (computer, smartphone, tablet) when you visit a
                website. They allow the website to recognize your device and store information about your preferences
                and activity.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                3. Types of Cookies We Use
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-amber-900/20">
                  <thead>
                    <tr className="bg-amber-900/10">
                      <th className="border border-amber-900/20 p-3 text-left text-amber-100 font-semibold">Type of Cookie</th>
                      <th className="border border-amber-900/20 p-3 text-left text-amber-100 font-semibold">Purpose</th>
                      <th className="border border-amber-900/20 p-3 text-left text-amber-100 font-semibold">Duration</th>
                      <th className="border border-amber-900/20 p-3 text-left text-amber-100 font-semibold">Example</th>
                    </tr>
                  </thead>
                  <tbody className="text-amber-50/90">
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Strictly Necessary Cookies</td>
                      <td className="border border-amber-900/20 p-3">Essential for the functioning of the website, including security and access control.</td>
                      <td className="border border-amber-900/20 p-3">Session</td>
                      <td className="border border-amber-900/20 p-3">Authentication and session cookies.</td>
                    </tr>
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Performance Cookies</td>
                      <td className="border border-amber-900/20 p-3">Help us understand how visitors interact with our site by collecting anonymous usage data.</td>
                      <td className="border border-amber-900/20 p-3">Persistent</td>
                      <td className="border border-amber-900/20 p-3">Google Analytics, Hotjar.</td>
                    </tr>
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Functionality Cookies</td>
                      <td className="border border-amber-900/20 p-3">Enable us to remember your preferences and personalize your experience.</td>
                      <td className="border border-amber-900/20 p-3">Persistent</td>
                      <td className="border border-amber-900/20 p-3">Language, location, and layout settings.</td>
                    </tr>
                    <tr>
                      <td className="border border-amber-900/20 p-3 font-medium">Targeting/Advertising Cookies</td>
                      <td className="border border-amber-900/20 p-3">Used to deliver relevant ads and track campaign performance.</td>
                      <td className="border border-amber-900/20 p-3">Persistent</td>
                      <td className="border border-amber-900/20 p-3">Meta Pixel, LinkedIn Insight Tag.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                4. Third-Party Cookies
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                We use third-party services to enhance your experience and analyse site performance. These third
                parties may set their own cookies on your device:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li>Google Analytics</li>
                <li>Meta/Facebook Pixel</li>
                <li>LinkedIn Insight</li>
                <li>Calendly (for scheduling expert sessions)</li>
                <li>Stripe/PayPal (for payment processing)</li>
              </ul>
              <p className="text-amber-50/90 leading-relaxed mt-4">
                These third-party cookies are governed by their respective privacy policies.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                5. Managing Cookies
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li><strong className="text-amber-100">Browser Settings:</strong> Most browsers allow you to block or delete cookies via the settings menu.</li>
                <li><strong className="text-amber-100">Consent Banner:</strong> Upon visiting our site, you will be asked to accept or reject non-essential cookies.</li>
                <li><strong className="text-amber-100">Opt-Out Links:</strong> You can opt out of third-party tracking via tools such as:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Google Analytics Opt-Out</li>
                    <li>Your Online Choices (EU)</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                6. Changes to This Policy
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                We may update this Cookies Policy from time to time. Changes will be posted on this page and, where
                appropriate, notified to you via email or website notification.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                7. Contact Us
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                If you have any questions or concerns about this Cookies Policy or our cookie practices, please contact:
              </p>
              <div className="mt-4 p-4 glass rounded-lg">
                <p className="text-amber-50/90">
                  <strong className="text-amber-100">Email:</strong>{" "}
                  <a 
                    href="mailto:contact@ambitiouscare.co" 
                    className="text-amber-200 hover:text-amber-100 underline transition-colors"
                  >
                    contact@ambitiouscare.co
                  </a>
                </p>
                <p className="text-amber-50/90 mt-2">
                  <strong className="text-amber-100">Company:</strong> Ambitious Care Ltd
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CookiesPolicy; 