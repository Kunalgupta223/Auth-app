// Runtime config JSON (simulate fetching from /config.json)
    const config = {
      remotes: {
        authApp: {
          name: 'authApp',
          url: 'authApp', // logical name, no real URL since all in one file
          exposes: ['Login', 'User Profile']
        },
        // You can add new modules here dynamically without rebuilding host
        // e.g. bookingApp: { name: 'bookingApp', url: 'bookingApp', exposes: ['BookingList'] }
      }
    };

    // Simple event bus for cross-app communication
    const eventBus = {
      events: {},
      on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
      },
      emit(event, data) {
        (this.events[event] || []).forEach(fn => fn(data));
      }
    };

    // User/session state shared across micro-frontends
    const sharedState = {
      user: null,
      setUser (user) {
        this.user = user;
        eventBus.emit('userChanged', user);
      },
      getUser () {
        return this.user;
      }
    };

    // Micro-frontend implementations (simulate remote modules)
    const microFrontends = {
      authApp: {
        Login: function(container) {
          // Clear container
          container.innerHTML = '';

          const user = sharedState.getUser ();

          const title = document.createElement('h2');
          title.textContent = 'Auth App - Login';

          const info = document.createElement('p');
          info.textContent = user ? `Logged in as ${user.name} (${user.email})` : 'Not logged in';

          const loginBtn = document.createElement('button');
          loginBtn.className = 'btn btn-success me-2';
          loginBtn.textContent = 'Login';

          const logoutBtn = document.createElement('button');
          logoutBtn.className = 'btn btn-danger';
          logoutBtn.textContent = 'Logout';

          loginBtn.onclick = () => {
            sharedState.setUser ({ name: 'John Doe', email: 'john@example.com' });
          };

          logoutBtn.onclick = () => {
            sharedState.setUser (null);
          };

          container.appendChild(title);
          container.appendChild(info);
          if (!user) {
            container.appendChild(loginBtn);
          } else {
            container.appendChild(logoutBtn);
          }

          // Update UI on user change
          eventBus.on('userChanged', (newUser ) => {
            info.textContent = newUser  ? `Logged in as ${newUser .name} (${newUser .email})` : 'Not logged in';
            if (newUser ) {
              if (!container.contains(logoutBtn)) {
                container.appendChild(logoutBtn);
              }
              if (container.contains(loginBtn)) {
                container.removeChild(loginBtn);
              }
            } else {
              if (!container.contains(loginBtn)) {
                container.appendChild(loginBtn);
              }
              if (container.contains(logoutBtn)) {
                container.removeChild(logoutBtn);
              }
            }
          });
        },

        UserProfile: function(container) {
          container.innerHTML = '';

          const user = sharedState.getUser ();

          const title = document.createElement('h2');
          title.textContent = 'Auth App - User Profile';

          container.appendChild(title);

          if (!user) {
            const msg = document.createElement('p');
            msg.textContent = 'No user logged in.';
            container.appendChild(msg);
            return;
          }

          const nameP = document.createElement('p');
          nameP.textContent = `Name: ${user.name}`;

          const emailP = document.createElement('p');
          emailP.textContent = `Email: ${user.email}`;

          container.appendChild(nameP);
          container.appendChild(emailP);

          // Update profile on user change
          eventBus.on('userChanged', (newUser ) => {
            if (!newUser ) {
              container.innerHTML = '<p>No user logged in.</p>';
            } else {
              nameP.textContent = `Name: ${newUser .name}`;
              emailP.textContent = `Email: ${newUser .email}`;
            }
          });
        }
      }
    };

    // Error Boundary simulation
    function renderWithErrorBoundary(renderFn, container, fallbackMessage) {
      try {
        renderFn(container);
        fallbackDiv.classList.add('d-none');
      } catch (e) {
        console.error('Error loading module:', e);
        fallbackDiv.textContent = fallbackMessage;
        fallbackDiv.classList.remove('d-none');
        container.innerHTML = '';
      }
    }

    // Navigation and routing simulation
    const nav = document.getElementById('nav');
    const appContainer = document.getElementById('app-container');
    const fallbackDiv = document.getElementById('fallback');

    // Current loaded module and component
    let currentModule = null;
    let currentComponent = null;

    // Build nav dynamically from config
    function buildNav() {
      nav.innerHTML = '';
      Object.entries(config.remotes).forEach(([moduleName, moduleInfo]) => {
        // For each exposed component, create a nav item
        moduleInfo.exposes.forEach(componentName => {
          const li = document.createElement('li');
          li.className = 'nav-item';

          const a = document.createElement('a');
          a.className = 'nav-link';
          a.textContent = `${moduleName} - ${componentName}`;
          a.href = '#';
          a.onclick = (e) => {
            e.preventDefault();
            loadModuleComponent(moduleName, componentName);
            setActiveNav(a);
          };

          li.appendChild(a);
          nav.appendChild(li);
        });
      });
    }

    // Set active nav link styling
    function setActiveNav(activeLink) {
      Array.from(nav.querySelectorAll('a')).forEach(a => {
        a.classList.remove('active');
      });
      activeLink.classList.add('active');
    }

    // Load module component dynamically
    function loadModuleComponent(moduleName, componentName) {
      currentModule = moduleName;
      currentComponent = componentName;

      const module = microFrontends[moduleName];
      if (!module) {
        fallbackDiv.textContent = `${moduleName} module is currently unavailable.`;
        fallbackDiv.classList.remove('d-none');
        appContainer.innerHTML = '';
        return;
      }

      const component = module[componentName];
      if (!component) {
        fallbackDiv.textContent = `${componentName} component is currently unavailable in ${moduleName}.`;
        fallbackDiv.classList.remove('d-none');
        appContainer.innerHTML = '';
        return;
      }

      renderWithErrorBoundary(() => component(appContainer), appContainer, `${componentName} component failed to load.`);
    }

    // Initialize app
    function init() {
      buildNav();

      // Load first module/component by default
      const firstModule = Object.keys(config.remotes)[0];
      const firstComponent = config.remotes[firstModule].exposes[0];
      if (firstModule && firstComponent) {
        loadModuleComponent(firstModule, firstComponent);
        // Set active nav link
        const firstLink = nav.querySelector('a');
        if (firstLink) firstLink.classList.add('active');
      }
    }

    init();

    // Bonus: Dynamically add a new module at runtime (simulate adding without rebuild)
    // Uncomment below to test adding a new module dynamically after 5 seconds

    /*
    setTimeout(() => {
      config.remotes.bookingApp = {
        name: 'bookingApp',
        url: 'bookingApp',
        exposes: ['BookingList']
      };

      microFrontends.bookingApp = {
        BookingList: function(container) {
          container.innerHTML = '<h2>Booking App - Booking List</h2><p>List of bookings will appear here.</p>';
        }
      };

      buildNav();
      alert('New module "bookingApp" added dynamically! Check navigation.');
    }, 5000);
    */