import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsAndConditions = () => {
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
            Terms and Conditions
          </h1>
          <p className="text-amber-100/80 text-lg">
            Effective Date: 30/07/2025
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
                Welcome to AmbitiousCare.co
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                Welcome to AmbitiousCare.co, a holistic digital platform designed to provide blue-collar workers with
                access to expert support across various life categories, including mental health, relationships,
                financial guidance, health & wellness, and career advancement. These Terms and Conditions
                govern your access and use of our platform, services, and content. By accessing
                AmbitiousCare.co, you agree to be bound by these Terms.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                1. Definitions
              </h2>
              <div className="space-y-3 text-amber-50/90">
                <p><strong className="text-amber-100">"Company"</strong> refers to AmbitiousCare.co and its affiliates.</p>
                <p><strong className="text-amber-100">"User"</strong> refers to any individual or company that accesses the services of AmbitiousCare.co.</p>
                <p><strong className="text-amber-100">"Experts"</strong> refers to third-party professionals engaged on the platform to provide support and services.</p>
                <p><strong className="text-amber-100">"Services"</strong> refers to all tools, content, consultations, and digital functionalities provided via AmbitiousCare.co.</p>
              </div>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                2. Acceptance of Terms
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                By accessing or using the platform, you affirm that you have read, understood, and agree to be bound by these Terms. 
                If you do not agree, please discontinue use immediately.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                3. Scope of Services
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                AmbitiousCare.co offers holistic, non-clinical support services from verified experts in the following domains:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li>Mental Health</li>
                <li>Relationship & Family</li>
                <li>Financial Advisory</li>
                <li>Health & Wellness</li>
                <li>Career & Personal Development</li>
              </ul>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                4. Eligibility
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                Use of the platform is limited to individuals aged 18 years or older. Users must ensure that all provided 
                information is accurate, current, and complete.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                5. User Obligations
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                Users agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li>Use the platform for unlawful purposes</li>
                <li>Share or distribute sensitive or confidential content without consent</li>
                <li>Impersonate any individual or entity</li>
                <li>Reverse engineer or disrupt the functionality of the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                6. Expert Engagement
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                All experts on the platform are vetted but act as independent contractors. AmbitiousCare.co does not hold 
                responsibility for individual outcomes derived from expert consultations. Users are encouraged to exercise personal discretion.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                7. Company Accounts & Dashboard
              </h2>
              <p className="text-amber-50/90 leading-relaxed mb-4">
                Companies using the Employer Dashboard are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-50/90 ml-4">
                <li>Maintaining the confidentiality of credentials</li>
                <li>Ensuring compliance with data protection laws</li>
                <li>Not misusing employee engagement analytics or personal information</li>
              </ul>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                8. Payment and Subscription
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                Fees apply for access to certain services. Weekly fees for services rendered (e.g., $80/week for virtual 
                assistant services) are agreed upon in writing and are payable in advance. Incentive bonuses may be offered 
                upon completion of objectives.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                9. Intellectual Property
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                All content, branding, and proprietary tools used on AmbitiousCare.co are owned by the Company and may not 
                be copied, modified, or distributed without express written consent.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                10. Data Protection and Confidentiality
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                We comply with GDPR and applicable UK data protection laws. Data collected will be used solely for providing 
                and improving our services and will not be shared without explicit consent.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                11. Limitation of Liability
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                AmbitiousCare.co shall not be held liable for indirect or consequential damages resulting from use or 
                inability to use the platform.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                12. Termination
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                We reserve the right to suspend or terminate any account that breaches these Terms. Users may terminate 
                their accounts by written request.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                13. Changes to Terms
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                AmbitiousCare.co reserves the right to modify these Terms at any time. Continued use after updates 
                constitutes agreement to the new Terms.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                14. Governing Law
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of the United Kingdom.
              </p>
            </section>

            <section>
              <h2 className="gradient-text text-2xl font-semibold mb-4">
                15. Contact
              </h2>
              <p className="text-amber-50/90 leading-relaxed">
                For questions about these Terms, contact us at:{" "}
                <a 
                  href="mailto:contact@ambitiouscare.co" 
                  className="text-amber-200 hover:text-amber-100 underline transition-colors"
                >
                  contact@ambitiouscare.co
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions; 