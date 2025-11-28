// Auto-save JWT token from login/register responses
(function() {
  // Wait for Swagger UI to load
  const checkSwaggerUI = setInterval(() => {
    if (window.ui) {
      clearInterval(checkSwaggerUI);
      initTokenAutoSave();
    }
  }, 100);

  function initTokenAutoSave() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(async (response) => {
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        
        try {
          const url = typeof args[0] === 'string' ? args[0] : args[0].url;
          
          // Check if this is an auth endpoint
          if (response.ok && 
              (url.includes('/api/auth/login') || 
               url.includes('/api/auth/register') || 
               url.includes('/api/auth/google/callback'))) {
            
            const data = await clonedResponse.json();
            
            if (data.accessToken) {
              // Store token
              localStorage.setItem('swagger_auth_token', data.accessToken);
              
              // Auto-authorize in Swagger UI
              if (window.ui && window.ui.authActions) {
                window.ui.authActions.authorize({
                  'JWT-auth': {
                    name: 'JWT-auth',
                    schema: {
                      type: 'http',
                      scheme: 'bearer'
                    },
                    value: data.accessToken
                  }
                });
              }
              
              // Show notification
              showNotification('✅ Token guardado automáticamente');
              
              console.log('🔐 Token saved and authorized automatically');
              console.log('Token:', data.accessToken.substring(0, 20) + '...');
            }
          }
        } catch (e) {
          // Ignore errors (non-JSON responses, etc.)
        }
        
        return response;
      });
    };

    // Try to restore token on load
    const savedToken = localStorage.getItem('swagger_auth_token');
    if (savedToken && window.ui && window.ui.authActions) {
      setTimeout(() => {
        window.ui.authActions.authorize({
          'JWT-auth': {
            name: 'JWT-auth',
            schema: {
              type: 'http',
              scheme: 'bearer'
            },
            value: savedToken
          }
        });
        console.log('🔐 Token restored from localStorage');
      }, 1000);
    }
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #49cc90;
      color: white;
      padding: 15px 25px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
})();
