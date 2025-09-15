// Static Form Submission Configuration
// This file provides multiple form submission methods for static websites
// Supports EmailJS, Formspree, and native form submission fallbacks

// Configuration for different form services
const formServiceConfig = {
  // EmailJS Configuration (Client-side email service)
  emailjs: {
    serviceId: 'service_cafe', // Your EmailJS service ID
    publicKey: 'KOkZYhhPKpQ7NmwF_', // Your EmailJS public key
    templates: {
      contact: 'template_contact-form', // Your contact template ID
      franchise: 'template_contact-form', // Using same template as contact form
      newsletter: 'template_newsletter', // Your newsletter template ID
    }
  },
  
  // Formspree Configuration (Static form service) - Using real endpoints
  formspree: {
    endpoints: {
      contact: 'https://formspree.io/f/xdorpqpv', // Real contact form endpoint
      franchise: 'https://formspree.io/f/xdorpqpx', // Real franchise form endpoint
      newsletter: 'https://formspree.io/f/xdorpqpw', // Real newsletter form endpoint
    }
  },
  
  // Fallback configuration for direct email
  fallback: {
    email: 'info@deathbycoffee.in',
    subject: 'Contact from Death By Coffee Website'
  }
};

// Utility function to check if we're in browser environment
function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

// EmailJS form submission handler
async function submitWithEmailJS(formType, formData) {
  if (!isBrowser()) {
    throw new Error('EmailJS is only available in browser environment');
  }

  try {
    // Dynamic import of EmailJS to avoid SSR issues
    const emailjs = await import('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js');
    
    // Initialize EmailJS if not already done
    if (!window.emailjs) {
      emailjs.init(formServiceConfig.emailjs.publicKey);
      window.emailjs = emailjs;
    }

    let templateParams = {};
    
    // Configure template parameters based on form type
    switch (formType) {
      case 'contact':
        templateParams = {
          from_name: 'Death By Coffee Contact Form',
          from_email: 'info@deathbycoffee.in',
          to_email: 'info@deathbycoffee.in',
          reply_to: formData.email,
          client_name: formData.name,
          client_email: formData.email,
          phone: formData.phone || '',
          subject: formData.subject,
          message: formData.message,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        };
        break;
        
      case 'franchise':
        templateParams = {
          from_name: 'Death By Coffee Franchise Application',
          from_email: 'info@deathbycoffee.in',
          to_email: 'info@deathbycoffee.in',
          reply_to: formData.email,
          subject: 'New Death By Coffee Franchise Application',
          client_name: `${formData.firstName} ${formData.lastName}`,
          client_email: formData.email,
          phone: formData.phone,
          location: formData.location,
          experience: formData.experience,
          investment: formData.investment,
          timeline: formData.timeline,
          background: formData.background,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        };
        break;
        
      case 'newsletter':
        templateParams = {
          from_name: 'Death By Coffee Newsletter Subscription',
          from_email: 'info@deathbycoffee.in',
          to_email: 'info@deathbycoffee.in',
          reply_to: formData.email,
          subject: 'New Newsletter Subscription',
          subscriber_email: formData.email,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        };
        break;
        
      default:
        throw new Error(`Unknown form type: ${formType}`);
    }

    const result = await emailjs.send(
      formServiceConfig.emailjs.serviceId,
      formServiceConfig.emailjs.templates[formType],
      templateParams,
      formServiceConfig.emailjs.publicKey
    );

    return { success: true, service: 'emailjs', result };
  } catch (error) {
    console.error('EmailJS submission failed:', error);
    throw error;
  }
}

// Formspree form submission handler
async function submitWithFormspree(formType, formData) {
  if (!isBrowser()) {
    throw new Error('Formspree is only available in browser environment');
  }

  try {
    const endpoint = formServiceConfig.formspree.endpoints[formType];
    if (!endpoint) {
      throw new Error(`No Formspree endpoint configured for form type: ${formType}`);
    }

    // Prepare form data for Formspree
    const submitData = new FormData();
    
    // Add form fields based on form type
    switch (formType) {
      case 'contact':
        submitData.append('name', formData.name);
        submitData.append('email', formData.email);
        submitData.append('phone', formData.phone || '');
        submitData.append('subject', formData.subject);
        submitData.append('message', formData.message);
        submitData.append('_subject', `Contact from ${formData.name}: ${formData.subject}`);
        break;
        
      case 'franchise':
        submitData.append('firstName', formData.firstName);
        submitData.append('lastName', formData.lastName);
        submitData.append('email', formData.email);
        submitData.append('phone', formData.phone);
        submitData.append('location', formData.location);
        submitData.append('experience', formData.experience);
        submitData.append('investment', formData.investment);
        submitData.append('timeline', formData.timeline);
        submitData.append('background', formData.background);
        submitData.append('_subject', `Franchise Application from ${formData.firstName} ${formData.lastName}`);
        break;
        
      case 'newsletter':
        submitData.append('email', formData.email);
        submitData.append('_subject', 'New Newsletter Subscription');
        break;
        
      default:
        throw new Error(`Unknown form type: ${formType}`);
    }

    // Add timestamp and form source
    submitData.append('timestamp', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    submitData.append('source', 'Death By Coffee Website');
    submitData.append('_replyto', formData.email);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: submitData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Formspree submission failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, service: 'formspree', result };
  } catch (error) {
    console.error('Formspree submission failed:', error);
    throw error;
  }
}

// Fallback submission using mailto (opens email client)
function submitWithMailto(formType, formData) {
  if (!isBrowser()) {
    throw new Error('Mailto fallback is only available in browser environment');
  }

  try {
    let subject = '';
    let body = '';

    switch (formType) {
      case 'contact':
        subject = encodeURIComponent(`Contact: ${formData.subject}`);
        body = encodeURIComponent(
          `Name: ${formData.name}\n` +
          `Email: ${formData.email}\n` +
          `Phone: ${formData.phone || 'Not provided'}\n` +
          `Subject: ${formData.subject}\n\n` +
          `Message:\n${formData.message}\n\n` +
          `Sent from Death By Coffee website at ${new Date().toLocaleString()}`
        );
        break;
        
      case 'franchise':
        subject = encodeURIComponent(`Franchise Application from ${formData.firstName} ${formData.lastName}`);
        body = encodeURIComponent(
          `Franchise Application Details:\n\n` +
          `Name: ${formData.firstName} ${formData.lastName}\n` +
          `Email: ${formData.email}\n` +
          `Phone: ${formData.phone}\n` +
          `Preferred Location: ${formData.location}\n` +
          `Experience Level: ${formData.experience}\n` +
          `Investment Capacity: ${formData.investment}\n` +
          `Timeline: ${formData.timeline}\n\n` +
          `Background:\n${formData.background}\n\n` +
          `Submitted from Death By Coffee website at ${new Date().toLocaleString()}`
        );
        break;
        
      case 'newsletter':
        subject = encodeURIComponent('Newsletter Subscription Request');
        body = encodeURIComponent(
          `Please subscribe the following email to the Death By Coffee newsletter:\n\n` +
          `Email: ${formData.email}\n\n` +
          `Submitted from Death By Coffee website at ${new Date().toLocaleString()}`
        );
        break;
        
      default:
        throw new Error(`Unknown form type: ${formType}`);
    }

    const mailtoUrl = `mailto:${formServiceConfig.fallback.email}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
    
    return { success: true, service: 'mailto', message: 'Email client opened' };
  } catch (error) {
    console.error('Mailto fallback failed:', error);
    throw error;
  }
}

// Main form submission handler with multiple fallbacks
async function submitForm(formType, formData, options = {}) {
  const { preferredService = 'formspree', enableFallbacks = true } = options;
  
  if (!isBrowser()) {
    throw new Error('Form submission is only available in browser environment');
  }

  const results = [];
  let lastError = null;

  // Determine submission order based on preferred service - prioritize Formspree for static sites
  let submissionMethods = [];
  
  if (preferredService === 'formspree' || preferredService === 'auto') {
    submissionMethods.push({ name: 'formspree', handler: submitWithFormspree });
  }
  
  if (preferredService === 'emailjs' || preferredService === 'auto') {
    submissionMethods.push({ name: 'emailjs', handler: submitWithEmailJS });
  }

  // Try each submission method
  for (const method of submissionMethods) {
    try {
      console.log(`Attempting form submission with ${method.name}...`);
      const result = await method.handler(formType, formData);
      results.push(result);
      
      // If successful, return immediately
      if (result.success) {
        console.log(`Form submitted successfully with ${method.name}`);
        return {
          success: true,
          service: result.service,
          results,
          method: method.name
        };
      }
    } catch (error) {
      console.warn(`${method.name} submission failed:`, error);
      lastError = error;
      results.push({ success: false, service: method.name, error: error.message });
    }
  }

  // If all automated methods failed and fallbacks are enabled, try mailto
  if (enableFallbacks) {
    try {
      console.log('All automated methods failed, trying mailto fallback...');
      const fallbackResult = submitWithMailto(formType, formData);
      results.push(fallbackResult);
      
      return {
        success: true,
        service: 'mailto',
        results,
        method: 'fallback',
        message: 'Please send the email that just opened in your email client.'
      };
    } catch (error) {
      console.error('Mailto fallback also failed:', error);
      results.push({ success: false, service: 'mailto', error: error.message });
    }
  }

  // If everything failed, throw the last error
  throw new Error(`All form submission methods failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Individual form submission functions for easy use
const staticFormHandlers = {
  // Contact form submission
  async submitContactForm(formData, options = {}) {
    return await submitForm('contact', formData, options);
  },

  // Franchise form submission
  async submitFranchiseForm(formData, options = {}) {
    return await submitForm('franchise', formData, options);
  },

  // Newsletter subscription
  async submitNewsletterSubscription(email, options = {}) {
    return await submitForm('newsletter', { email }, options);
  },

  // Generic form submission
  async submitForm(formType, formData, options = {}) {
    return await submitForm(formType, formData, options);
  }
};

// Ensure proper global assignment
if (isBrowser()) {
  // Main global configuration object
  window.staticFormConfig = {
    config: formServiceConfig,
    handlers: staticFormHandlers,
    submitForm,
    utils: { isBrowser, submitForm }
  };
  
  console.log('Static Form Configuration loaded successfully');
  console.log('Available handlers:', Object.keys(staticFormHandlers));
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formServiceConfig,
    staticFormHandlers,
    submitForm,
    utils: { isBrowser }
  };
}