import emailjs from "@emailjs/browser";

// Load EmailJS configuration from environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const THERAPIST_DASHBOARD_LINK = import.meta.env.VITE_THERAPIST_DASHBOARD_LINK;

/**
 * This interface defines the structure for the EmailJS configuration.
 * It is a direct replication of the structure from flashcard-email-genius.
 */
export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  therapistDashboardLink: string;
}

/**
 * This interface defines the structure for the EmailJS configuration status.
 * It is a direct replication of the structure from flashcard-email-genius.
 */
export interface EmailJSConfigStatus {
  isConfigured: boolean;
  missingConfig: {
    serviceId: boolean;
    templateId: boolean;
    publicKey: boolean;
    therapistDashboardLink: boolean;
  };
}

export interface EmailSendResult {
  success: number;
  failed: number;
  failedEmails: string[];
}

/**
 * Get the current EmailJS configuration status.
 * This is a direct replication of the structure from flashcard-email-genius.
 */
export const getEmailJSConfigStatus = (): EmailJSConfigStatus => {
  const missingConfig = {
    serviceId: !EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID.includes("your_"),
    templateId: !EMAILJS_TEMPLATE_ID || EMAILJS_TEMPLATE_ID.includes("your_"),
    publicKey: !EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY.includes("your_"),
    therapistDashboardLink: !THERAPIST_DASHBOARD_LINK,
  };

  const isConfigured = !Object.values(missingConfig).some((v) => v);

  return { isConfigured, missingConfig };
};

/**
 * Validate EmailJS configuration.
 * This is a direct replication of the structure from flashcard-email-genius.
 */
export const validateEmailJSConfig = (): EmailJSConfig => {
  const configStatus = getEmailJSConfigStatus();

  if (!configStatus.isConfigured) {
    const missingFields = Object.entries(configStatus.missingConfig)
      .filter(([_, missing]) => missing)
      .map(([field]) => field);

    const errorMessage = `EmailJS configuration missing in .env: ${missingFields.join(
      ", "
    )}`;
    console.error(`❌ ${errorMessage}`);
    throw new Error(errorMessage);
  }

  return {
    serviceId: EMAILJS_SERVICE_ID,
    templateId: EMAILJS_TEMPLATE_ID,
    publicKey: EMAILJS_PUBLIC_KEY,
    therapistDashboardLink: THERAPIST_DASHBOARD_LINK,
  };
};

/**
 * Sends a notification when a therapist cancels an appointment.
 */
export const sendCancellationEmail = async (
  patientEmail: string,
  therapistName: string,
  appointmentTime: string
): Promise<void> => {
  console.log(
    `--- Attempting to Send Cancellation Email to ${patientEmail} ---`
  );
  try {
    const config = validateEmailJSConfig();
    emailjs.init(config.publicKey);

    const templateParams = {
      to_email: patientEmail,
      subject: "Appointment Canceled",
      from_name: "AmbitiousCare Team",
      message: `Hi there,

Your appointment with ${therapistName} scheduled for ${appointmentTime} has been canceled. 
Please log in to your dashboard to reschedule or contact your therapist.

We apologize for any inconvenience.

Best,
The AmbitiousCare Team`,
    };

    console.log(
      "Sending cancellation email with params:",
      JSON.stringify(templateParams, null, 2)
    );

    await emailjs.send(config.serviceId, config.templateId, templateParams);

    console.log(`✅ Cancellation email sent successfully to ${patientEmail}`);
  } catch (error) {
    console.error(
      `❌ Failed to send cancellation email to ${patientEmail}:`,
      error
    );
    throw error;
  }
};

/**
 * Sends a rapid alert email to all therapists in bulk.
 */
export const sendBulkRapidAlertEmails = async (
  therapistEmails: string[],
  patientName: string
): Promise<EmailSendResult> => {
  console.log(
    `--- Attempting to Send Rapid Alert Emails to ${therapistEmails.length} therapists ---`
  );

  const results: EmailSendResult = {
    success: 0,
    failed: 0,
    failedEmails: [],
  };

  if (therapistEmails.length === 0) {
    return results;
  }

  try {
    const config = validateEmailJSConfig();
    emailjs.init(config.publicKey);

    // Process in batches of 3 to avoid rate limiting
    const batchSize = 3;
    const batches = [];

    for (let i = 0; i < therapistEmails.length; i += batchSize) {
      batches.push(therapistEmails.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (email) => {
        try {
          const templateParams = {
            to_email: email,
            subject: "RAPID ALERT: Urgent Assistance Required",
            from_name: "AmbitiousCare System",
            message: `Hi there,\n\nA patient, ${patientName}, has raised a RAPID ALERT and requires immediate assistance.\n\nPlease log in to your dashboard to view the details and take action.\nDashboard Link: ${config.therapistDashboardLink}\n\nThis is an urgent request.\n\nBest,\nThe AmbitiousCare System`,
            patient_name: patientName,
            therapist_dashboard_link: config.therapistDashboardLink,
          };

          await emailjs.send(
            config.serviceId,
            config.templateId,
            templateParams
          );

          console.log(`✅ Rapid alert email sent successfully to ${email}`);
          return { email, success: true };
        } catch (error) {
          console.error(
            `❌ Failed to send rapid alert email to ${email}:`,
            error
          );
          return { email, success: false };
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Process results
      batchResults.forEach(({ email, success }) => {
        if (success) {
          results.success++;
        } else {
          results.failed++;
          results.failedEmails.push(email);
        }
      });

      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log(
      `Rapid alert email sending completed. Success: ${results.success}, Failed: ${results.failed}`
    );
    return results;
  } catch (error: any) {
    console.error("Failed to send rapid alert emails:", error);

    // Mark all as failed if there's a configuration error
    results.failed = therapistEmails.length;
    results.failedEmails = [...therapistEmails];
    return results;
  }
};
