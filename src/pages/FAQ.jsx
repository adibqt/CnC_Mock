import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FAQ.css';

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    {
      category: 'General',
      icon: 'icofont-question-circle',
      color: '#1a73e8',
      questions: [
        {
          question: 'What is Click & Care?',
          answer: 'Click & Care is a comprehensive online healthcare platform that connects patients with medical professionals for virtual consultations, AI-powered health assessments, prescription management, and access to pharmacy and laboratory services. Our platform makes healthcare accessible, convenient, and affordable for everyone.'
        },
        {
          question: 'How do I create an account?',
          answer: 'Creating an account is simple! Click on the "Get Appointment" or "Login/Register" button in the header, fill in your basic information including name, email, phone number, and password. You\'ll receive a verification email to activate your account. Once verified, you can complete your profile and start using our services.'
        },
        {
          question: 'Is Click & Care available 24/7?',
          answer: 'Yes! Our platform is accessible 24/7. While doctor availability may vary based on their schedules, our AI Health Assistant is available round the clock for preliminary health assessments and symptom checking.'
        },
        {
          question: 'What devices can I use to access Click & Care?',
          answer: 'Click & Care is a web-based platform that works on any device with an internet connection and a modern web browser. This includes desktop computers, laptops, tablets, and smartphones. For the best experience, we recommend using the latest version of Chrome, Firefox, Safari, or Edge.'
        }
      ]
    },
    {
      category: 'Appointments & Consultations',
      icon: 'icofont-doctor-alt',
      color: '#2ec4b6',
      questions: [
        {
          question: 'How do I book an appointment with a doctor?',
          answer: 'After logging in, navigate to your dashboard and click on "Book Appointment". Browse available doctors by specialty, view their profiles, check their availability, and select a convenient time slot. You can also search for doctors based on symptoms or specializations.'
        },
        {
          question: 'Can I reschedule or cancel my appointment?',
          answer: 'Yes, you can reschedule or cancel appointments from your patient dashboard. Go to "My Appointments", select the appointment you wish to modify, and choose either reschedule or cancel. Please note that cancellations should be made at least 2 hours before the scheduled time.'
        },
        {
          question: 'How do online consultations work?',
          answer: 'Online consultations are conducted through our secure video/audio platform. At your scheduled appointment time, join the consultation from your dashboard. The doctor will review your medical history, discuss your symptoms, and provide diagnosis and treatment recommendations. After the consultation, you\'ll receive a digital prescription if needed.'
        },
        {
          question: 'What if I miss my appointment?',
          answer: 'If you miss your appointment, you\'ll need to book a new one. We send reminder notifications before your scheduled time to help you remember. To avoid missing appointments, enable notifications in your account settings.'
        }
      ]
    },
    {
      category: 'AI Health Assistant',
      icon: 'icofont-robot',
      color: '#9b59b6',
      questions: [
        {
          question: 'What is the AI Health Assistant?',
          answer: 'Our AI Health Assistant is an advanced artificial intelligence system that provides preliminary health assessments based on your symptoms. It uses machine learning algorithms to analyze your input and suggest possible conditions, recommend whether you need to see a doctor, and provide general health guidance.'
        },
        {
          question: 'Is the AI diagnosis accurate?',
          answer: 'The AI Health Assistant provides preliminary assessments and should not replace professional medical advice. It\'s designed to help you understand your symptoms better and decide if you need to consult a doctor. For any serious health concerns, always consult with a qualified medical professional.'
        },
        {
          question: 'Is my health information shared with the AI secure?',
          answer: 'Absolutely! All information you share with the AI Health Assistant is encrypted and stored securely. We follow HIPAA compliance standards and never share your personal health information with third parties without your explicit consent.'
        }
      ]
    },
    {
      category: 'Prescriptions & Medications',
      icon: 'icofont-prescription',
      color: '#ff6b6b',
      questions: [
        {
          question: 'How do I receive prescriptions?',
          answer: 'After your consultation, if the doctor prescribes medication, you\'ll receive a digital prescription in your patient dashboard. The prescription includes all necessary details including medication names, dosages, duration, and doctor\'s signature. You can download or share this with pharmacies.'
        },
        {
          question: 'Can I get medicine through Click & Care?',
          answer: 'Yes! Once you have a prescription, you can request quotations from multiple partner pharmacies through our platform. Compare prices, choose the best option, and place your order. Many pharmacies offer home delivery for added convenience.'
        },
        {
          question: 'How long are prescriptions valid?',
          answer: 'Digital prescriptions are valid for the duration specified by the doctor, typically 30 days for regular medications. However, validity may vary based on the type of medication and local regulations. Always check with your pharmacist if you have concerns about prescription validity.'
        },
        {
          question: 'Can I view my prescription history?',
          answer: 'Yes, all your prescriptions are stored in your patient dashboard under "My Prescriptions". You can view, download, or share past prescriptions at any time. This feature helps you maintain a complete medical record and makes refills easier.'
        }
      ]
    },
    {
      category: 'Pharmacy & Lab Services',
      icon: 'icofont-pills',
      color: '#ffa502',
      questions: [
        {
          question: 'How does the pharmacy quotation system work?',
          answer: 'After receiving a prescription, you can request quotations from multiple partner pharmacies. Submit your prescription through the platform, and registered pharmacies will send you price quotes. You can compare prices and choose the pharmacy that offers the best value.'
        },
        {
          question: 'How do I book lab tests?',
          answer: 'If your doctor recommends lab tests, you\'ll receive a lab request in your dashboard. You can browse available diagnostic labs, compare prices, and book a test. Many labs offer home sample collection for your convenience.'
        },
        {
          question: 'How do I access my lab reports?',
          answer: 'Once your lab tests are completed, reports are uploaded directly to your patient dashboard. You\'ll receive a notification when reports are available. You can view, download, or share these reports with your doctor for follow-up consultations.'
        },
        {
          question: 'Are all medicines and tests genuine?',
          answer: 'Yes! We partner only with verified and licensed pharmacies and diagnostic laboratories. All our partners are thoroughly vetted to ensure they meet quality standards and provide genuine products and services.'
        }
      ]
    },
    {
      category: 'Payments & Pricing',
      icon: 'icofont-money',
      color: '#27ae60',
      questions: [
        {
          question: 'How much does a consultation cost?',
          answer: 'Consultation fees vary by doctor based on their specialty and experience. You can see each doctor\'s consultation fee on their profile page before booking. Fees typically range from $20 to $100 per consultation.'
        },
        {
          question: 'What payment methods are accepted?',
          answer: 'We accept various payment methods including credit/debit cards, digital wallets, and online banking. All transactions are processed through secure payment gateways with encryption to protect your financial information.'
        },
        {
          question: 'Do you accept insurance?',
          answer: 'Currently, we operate on a direct payment model. However, we provide detailed receipts that you can submit to your insurance provider for potential reimbursement. Check with your insurance company about their telemedicine coverage policies.'
        },
        {
          question: 'What is your refund policy?',
          answer: 'If you cancel an appointment at least 2 hours before the scheduled time, you\'ll receive a full refund. Cancellations made less than 2 hours before or no-shows are non-refundable. For service-related issues, please contact our support team for case-by-case evaluation.'
        }
      ]
    },
    {
      category: 'Privacy & Security',
      icon: 'icofont-shield-alt',
      color: '#e74c3c',
      questions: [
        {
          question: 'Is my personal information secure?',
          answer: 'Yes! We use bank-level encryption (256-bit SSL) to protect all your personal and medical information. Our platform is HIPAA-compliant, and we follow strict security protocols to ensure your data privacy. We never share your information with third parties without your explicit consent.'
        },
        {
          question: 'Who can access my medical records?',
          answer: 'Only you and the doctors you consult have access to your medical records. Healthcare providers can only view information relevant to your consultation with them. You have full control over your data and can manage access permissions from your account settings.'
        },
        {
          question: 'How is video consultation privacy maintained?',
          answer: 'All video consultations are conducted through our encrypted platform. Sessions are not recorded unless you explicitly provide consent. The communication is end-to-end encrypted, ensuring that only you and your doctor can see and hear the conversation.'
        },
        {
          question: 'Can I delete my account and data?',
          answer: 'Yes, you can request account deletion at any time from your account settings. Upon request, we will permanently delete your personal information within 30 days, subject to legal requirements for medical record retention. Some anonymized data may be retained for service improvement purposes.'
        }
      ]
    },
    {
      category: 'Technical Support',
      icon: 'icofont-support',
      color: '#3498db',
      questions: [
        {
          question: 'What should I do if I\'m having technical issues?',
          answer: 'If you experience technical difficulties, try refreshing your browser, clearing your cache, or using a different browser. If problems persist, contact our support team through the "Contact Us" page or email us at support@clickandcare.com with details about the issue.'
        },
        {
          question: 'What are the system requirements for video consultations?',
          answer: 'For optimal video consultations, you need a stable internet connection (minimum 1 Mbps), a device with a camera and microphone, and a modern web browser (Chrome, Firefox, Safari, or Edge). We recommend testing your setup before your first consultation.'
        },
        {
          question: 'How do I enable notifications?',
          answer: 'Navigate to your account settings and look for the "Notifications" section. You can enable browser notifications, email notifications, and SMS alerts for appointments, prescription updates, and other important information.'
        },
        {
          question: 'I forgot my password. How do I reset it?',
          answer: 'Click on the "Forgot Password" link on the login page. Enter your registered email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password. If you don\'t receive the email, check your spam folder or contact support.'
        }
      ]
    }
  ];

  const toggleFAQ = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setActiveIndex(activeIndex === index ? null : index);
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <>
      

      {/* FAQ Hero Section */}
      <section className="faq-hero section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="faq-hero-content">
                <h2>How Can We Help You?</h2>
                <p>Search our FAQ database for quick answers to common questions about Click & Care</p>
                <div className="faq-search">
                  <div className="search-wrapper">
                    <i className="icofont-search"></i>
                    <input 
                      type="text" 
                      placeholder="Search for answers..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End FAQ Hero */}

      {/* FAQ Categories Section */}
      <section className="faq-categories section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-title">
                <h2>Browse by Category</h2>
                <p>Select a category to find relevant questions</p>
              </div>
            </div>
          </div>
          <div className="row">
            {faqCategories.map((category, catIndex) => (
              <div className="col-lg-3 col-md-6 col-12" key={catIndex}>
                <div className="category-card" style={{ '--category-color': category.color }}>
                  <div className="category-icon">
                    <i className={category.icon}></i>
                  </div>
                  <h4>{category.category}</h4>
                  <p>{category.questions.length} Questions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* End FAQ Categories */}

      {/* FAQ Accordion Section */}
      <section className="faq-accordion section">
        <div className="container">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, catIndex) => (
              <div className="faq-category-section" key={catIndex}>
                <div className="category-header">
                  <div className="category-icon-small" style={{ backgroundColor: category.color }}>
                    <i className={category.icon}></i>
                  </div>
                  <h3>{category.category}</h3>
                </div>
                <div className="accordion-wrapper">
                  {category.questions.map((item, qIndex) => {
                    const index = `${catIndex}-${qIndex}`;
                    const isActive = activeIndex === index;
                    return (
                      <div className={`accordion-item ${isActive ? 'active' : ''}`} key={qIndex}>
                        <button 
                          className="accordion-header"
                          onClick={() => toggleFAQ(catIndex, qIndex)}
                        >
                          <span className="question-number">{qIndex + 1}</span>
                          <span className="question-text">{item.question}</span>
                          <i className={`icofont-${isActive ? 'minus' : 'plus'}`}></i>
                        </button>
                        <div className={`accordion-content ${isActive ? 'active' : ''}`}>
                          <p>{item.answer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <i className="icofont-search-document"></i>
              <h3>No Results Found</h3>
              <p>We couldn't find any questions matching your search. Try different keywords or browse by category.</p>
            </div>
          )}
        </div>
      </section>
      {/* End FAQ Accordion */}

      {/* Still Have Questions Section */}
      <section className="faq-cta section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="cta-content">
                <div className="cta-icon">
                  <i className="icofont-question-circle"></i>
                </div>
                <h2>Still Have Questions?</h2>
                <p>Can't find the answer you're looking for? Our support team is here to help!</p>
                <div className="cta-buttons">
                  <Link to="/contact" className="btn primary">
                    <i className="icofont-envelope"></i>
                    Contact Support
                  </Link>
                  <a href="mailto:support@clickandcare.com" className="btn secondary">
                    <i className="icofont-email"></i>
                    Email Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Still Have Questions */}
    </>
  );
}
