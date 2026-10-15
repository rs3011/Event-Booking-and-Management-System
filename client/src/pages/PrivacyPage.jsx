import useDocumentTitle from '../hooks/useDocumentTitle';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content:
      'We collect information you provide directly to us when creating an account, registering for events, or contacting support. This includes your name, email address, student or institutional affiliation, and profile details. If you are an event organizer, we also collect event details and media uploaded to your events.',
  },
  {
    title: '2. How We Use Your Information',
    content:
      'We use your information to operate, personalize, and improve EventViser. This includes processing registrations, issuing digital tickets with confirmation codes and QR passes, sending transactional notifications, preventing duplicate bookings, and helping organizers manage check-ins.',
  },
  {
    title: '3. Information Sharing & Disclosure',
    content:
      'When you register for an event, your name and email are shared with the verified organizer of that event solely for attendance, roster management, and event updates. We do not sell, rent, or trade your personal data to third-party marketers.',
  },
  {
    title: '4. Data Security & Storage',
    content:
      'We implement industry-standard security measures including HTTPS TLS encryption, bcrypt password hashing, JSON Web Tokens (JWT), CSP headers, and rate limiting to protect your personal data against unauthorized access, alteration, or disclosure.',
  },
  {
    title: '5. Media & Uploads',
    content:
      'Images uploaded to EventViser (such as event posters and profile avatars) are processed and hosted securely through our media delivery network. Organizers are responsible for ensuring they possess rights to any imagery uploaded.',
  },
  {
    title: '6. Cookies & Local Storage',
    content:
      'EventViser uses browser local storage and essential session tokens to keep you securely signed in and preserve your theme preferences (light/dark mode). We do not use intrusive third-party cross-site advertising cookies.',
  },
  {
    title: '7. Your Rights & Choices',
    content:
      'You have the right to access, update, or delete your account information at any time via your Account Settings. You may also cancel your event registrations before an event starts to release your reserved seat.',
  },
  {
    title: '8. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. When significant changes occur, we will notify registered users via email and update the "Last updated" date at the top of this policy.',
  },
  {
    title: '9. Contact Us',
    content:
      'If you have any questions or concerns regarding our privacy practices or your data, please contact the EventViser platform administrators at support@campus.edu or through your campus organizer portal.',
  },
];

const PrivacyPage = () => {
  useDocumentTitle('Privacy Policy');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">
          Last updated: April 2026
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 shadow-sm">
          {SECTIONS.map((section) => (
            <div key={section.title} className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {section.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
