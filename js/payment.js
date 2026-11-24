/**
 * IssueBot Payment Integration
 * Handles payment method routing based on configuration
 */

const PaymentHandler = {
  config: null,
  
  /**
   * Initialize payment handler with configuration
   */
  async init() {
    try {
      const response = await fetch('config/payment.json');
      if (!response.ok) {
        throw new Error('Payment configuration not found');
      }
      this.config = await response.json();
      this.setupButtons();
    } catch (error) {
      console.warn('Payment integration: Using fallback configuration', error);
      this.config = {
        payment_method: 'github_sponsors',
        github_sponsors_url: 'https://github.com/sponsors',
        stripe_url: '',
        paypal_url: '',
        crypto: { enabled: false, addresses: {}, network: '' }
      };
      this.setupButtons();
    }
  },
  
  /**
   * Setup all payment buttons on the page
   */
  setupButtons() {
    // Setup pricing card buttons
    const pricingButtons = document.querySelectorAll('.pricing-card button');
    pricingButtons.forEach((button, index) => {
      const tier = this.getTierName(index);
      button.addEventListener('click', () => this.handlePayment(tier));
    });
    
    // Setup CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handlePayment('pro'); // Default to Pro tier
      });
    });
  },
  
  /**
   * Get tier name based on index
   */
  getTierName(index) {
    const tiers = ['free', 'pro', 'enterprise', 'custom'];
    return tiers[index] || 'pro';
  },
  
  /**
   * Handle payment for a specific tier
   */
  handlePayment(tier) {
    const action = this.getPaymentAction(tier);
    
    if (action.type === 'url') {
      window.open(action.url, '_blank');
    } else if (action.type === 'message') {
      this.showMessage(action.message);
    } else if (action.type === 'copy_address') {
      this.copyCryptoAddress(action.address, action.network);
    }
  },
  
  /**
   * Determine payment action based on tier and configuration
   */
  getPaymentAction(tier) {
    // Check for crypto payment
    if (this.config.crypto && this.config.crypto.enabled) {
      const address = this.config.crypto.addresses.ETH || 
                      this.config.crypto.addresses.BTC ||
                      Object.values(this.config.crypto.addresses)[0];
      if (address) {
        return {
          type: 'copy_address',
          address: address,
          network: this.config.crypto.network
        };
      }
    }
    
    // Check primary payment method
    switch (this.config.payment_method) {
      case 'stripe':
        if (this.config.stripe_url) {
          return { type: 'url', url: this.config.stripe_url };
        }
        break;
      case 'paypal':
        if (this.config.paypal_url) {
          return { type: 'url', url: this.config.paypal_url };
        }
        break;
      case 'custom':
        if (this.config.custom_service_url) {
          return { type: 'url', url: this.config.custom_service_url };
        }
        break;
    }
    
    // Fallback to GitHub Sponsors
    if (this.config.github_sponsors_url) {
      return { type: 'url', url: this.config.github_sponsors_url };
    }
    
    // Default fallback
    if (tier === 'free') {
      return { type: 'message', message: 'Free tier - Get started with the open source version on GitHub!' };
    } else if (tier === 'custom') {
      return { type: 'message', message: 'Contact us at sales@issuebot.ai for custom solutions.' };
    }
    
    return { 
      type: 'url', 
      url: 'https://github.com/sponsors'
    };
  },
  
  /**
   * Copy crypto address to clipboard
   */
  copyCryptoAddress(address, network) {
    navigator.clipboard.writeText(address).then(() => {
      this.showMessage(`Copied ${network} address to clipboard: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
    }).catch(err => {
      this.showMessage(`Failed to copy address: ${err.message}`);
    });
  },
  
  /**
   * Show a message to the user
   */
  showMessage(message) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 15px 25px;
      border-radius: 5px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    messageElement.textContent = message;
    document.body.appendChild(messageElement);
    
    // Remove after 5 seconds
    setTimeout(() => {
      messageElement.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => messageElement.remove(), 300);
    }, 5000);
  }
};

// Initialize payment handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PaymentHandler.init();
});
