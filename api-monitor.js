// API Monitor - Creates a floating window to monitor getData API calls
document.addEventListener('DOMContentLoaded', function() {
    // Create the API monitor window
    createAPIMonitorWindow();
    
    // Set up message event listener to capture data
    setupMessageListener();
    
    // Helper function to create the floating window
    function createAPIMonitorWindow() {
      // Create the main window container
      const monitorWindow = document.createElement('div');
      monitorWindow.id = 'api-monitor-window';
      monitorWindow.style.position = 'fixed';
      monitorWindow.style.top = '50px';
      monitorWindow.style.right = '50px';
      monitorWindow.style.width = '350px';
      monitorWindow.style.height = '400px';
      monitorWindow.style.backgroundColor = 'rgba(42, 42, 64, 0.95)';
      monitorWindow.style.color = '#fff';
      monitorWindow.style.border = '1px solid #444';
      monitorWindow.style.borderRadius = '5px';
      monitorWindow.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
      monitorWindow.style.zIndex = '9999';
      monitorWindow.style.display = 'flex';
      monitorWindow.style.flexDirection = 'column';
      monitorWindow.style.overflow = 'hidden';
      monitorWindow.style.fontFamily = 'Consolas, monospace';
      
      // Create window header
      const header = document.createElement('div');
      header.style.padding = '8px';
      header.style.backgroundColor = 'rgba(30, 30, 50, 0.9)';
      header.style.cursor = 'move';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.borderBottom = '1px solid #555';
      header.innerHTML = '<span style="font-weight: bold;">API Monitor</span>';
      
      // Add control buttons
      const controlsContainer = document.createElement('div');
      
      // Clear button
      const clearButton = document.createElement('button');
      clearButton.textContent = 'Clear';
      clearButton.style.marginRight = '5px';
      clearButton.style.padding = '2px 6px';
      clearButton.style.backgroundColor = '#555';
      clearButton.style.color = 'white';
      clearButton.style.border = 'none';
      clearButton.style.borderRadius = '3px';
      clearButton.style.cursor = 'pointer';
      clearButton.onclick = function() {
        clearLogs();
      };
      
      // Toggle button
      const toggleButton = document.createElement('button');
      toggleButton.textContent = 'Pause';
      toggleButton.style.marginRight = '5px';
      toggleButton.style.padding = '2px 6px';
      toggleButton.style.backgroundColor = '#555';
      toggleButton.style.color = 'white';
      toggleButton.style.border = 'none';
      toggleButton.style.borderRadius = '3px';
      toggleButton.style.cursor = 'pointer';
      toggleButton.onclick = function() {
        window.apiMonitor.paused = !window.apiMonitor.paused;
        toggleButton.textContent = window.apiMonitor.paused ? 'Resume' : 'Pause';
      };
      
      // Close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕';
      closeButton.style.padding = '2px 6px';
      closeButton.style.backgroundColor = '#555';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '3px';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = function() {
        monitorWindow.style.display = 'none';
      };
      
      controlsContainer.appendChild(clearButton);
      controlsContainer.appendChild(toggleButton);
      controlsContainer.appendChild(closeButton);
      header.appendChild(controlsContainer);
      
      // Create filter input
      const filterContainer = document.createElement('div');
      filterContainer.style.padding = '8px';
      filterContainer.style.backgroundColor = 'rgba(40, 40, 60, 0.9)';
      filterContainer.style.borderBottom = '1px solid #555';
      
      const filterInput = document.createElement('input');
      filterInput.id = 'api-monitor-filter';
      filterInput.type = 'text';
      filterInput.placeholder = 'Filter by key (comma separated)';
      filterInput.style.width = '100%';
      filterInput.style.backgroundColor = '#333';
      filterInput.style.color = '#fff';
      filterInput.style.border = '1px solid #555';
      filterInput.style.borderRadius = '3px';
      filterInput.style.padding = '5px';
      filterInput.oninput = function() {
        window.apiMonitor.filterKeys = this.value.split(',').map(k => k.trim()).filter(k => k);
        applyFilters();
      };
      
      filterContainer.appendChild(filterInput);
      
      // Create log content area
      const logContainer = document.createElement('div');
      logContainer.id = 'api-monitor-logs';
      logContainer.style.flex = '1';
      logContainer.style.overflowY = 'auto';
      logContainer.style.padding = '8px';
      logContainer.style.backgroundColor = 'rgba(30, 30, 40, 0.8)';
      
      // Create status bar
      const statusBar = document.createElement('div');
      statusBar.id = 'api-monitor-status';
      statusBar.style.padding = '5px 8px';
      statusBar.style.backgroundColor = 'rgba(40, 40, 60, 0.9)';
      statusBar.style.borderTop = '1px solid #555';
      statusBar.style.fontSize = '0.8em';
      statusBar.style.display = 'flex';
      statusBar.style.justifyContent = 'space-between';
      statusBar.innerHTML = '<span>Ready to monitor</span><span>0 messages</span>';
      
      // Assemble the window
      monitorWindow.appendChild(header);
      monitorWindow.appendChild(filterContainer);
      monitorWindow.appendChild(logContainer);
      monitorWindow.appendChild(statusBar);
      
      // Make the window draggable
      let isDragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      
      header.onmousedown = function(e) {
        isDragging = true;
        dragOffsetX = e.clientX - monitorWindow.offsetLeft;
        dragOffsetY = e.clientY - monitorWindow.offsetTop;
      };
      
      document.addEventListener('mousemove', function(e) {
        if (isDragging) {
          monitorWindow.style.left = (e.clientX - dragOffsetX) + 'px';
          monitorWindow.style.top = (e.clientY - dragOffsetY) + 'px';
          monitorWindow.style.right = 'auto';
        }
      });
      
      document.addEventListener('mouseup', function() {
        isDragging = false;
      });
      
      // Add the window to the document
      document.body.appendChild(monitorWindow);
      
      // Initialize global monitor state
      window.apiMonitor = {
        logs: [],
        paused: false,
        filterKeys: [],
        lastSeenValues: {},
        messageCount: 0
      };
    }
    
    // Clear logs and reset the display
    function clearLogs() {
      window.apiMonitor.logs = [];
      window.apiMonitor.lastSeenValues = {};
      window.apiMonitor.messageCount = 0;
      updateStatusBar();
      document.getElementById('api-monitor-logs').innerHTML = '';
    }
    
    // Apply filtering to the logs
    function applyFilters() {
      const logContainer = document.getElementById('api-monitor-logs');
      logContainer.innerHTML = '';
      
      for (const log of window.apiMonitor.logs) {
        // Only show if it passes the current filter
        if (shouldShowLog(log)) {
          logContainer.appendChild(createLogElement(log));
        }
      }
      
      // Scroll to the bottom
      logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // Check if a log should be shown based on filters
    function shouldShowLog(log) {
      // If no filters, show everything
      if (!window.apiMonitor.filterKeys || window.apiMonitor.filterKeys.length === 0) {
        return true;
      }
      
      // Check if any filter key exists in this log
      for (const key of window.apiMonitor.filterKeys) {
        if (doesKeyExist(log.data, key)) {
          return true;
        }
      }
      
      return false;
    }
    
    // Check if a key exists in an object (recursively)
    function doesKeyExist(obj, key) {
      if (!obj || typeof obj !== 'object') return false;
      
      if (key in obj) return true;
      
      for (const k in obj) {
        if (typeof obj[k] === 'object' && doesKeyExist(obj[k], key)) {
          return true;
        }
      }
      
      return false;
    }
    
    // Create an HTML element for a log entry
    function createLogElement(log) {
      const logElement = document.createElement('div');
      logElement.className = 'api-log-entry';
      logElement.style.marginBottom = '8px';
      logElement.style.padding = '6px';
      logElement.style.backgroundColor = 'rgba(50, 50, 70, 0.6)';
      logElement.style.borderRadius = '3px';
      logElement.style.fontSize = '0.85em';
      
      // Create timestamp
      const timestamp = document.createElement('div');
      timestamp.className = 'log-timestamp';
      timestamp.style.marginBottom = '4px';
      timestamp.style.color = '#aaa';
      timestamp.textContent = log.timestamp;
      
      // Create content
      const content = document.createElement('div');
      content.className = 'log-content';
      
      // Format based on content type
      if (log.type === 'getData') {
        content.style.color = '#8af';
        content.textContent = 'getData request sent';
      } else if (log.type === 'data') {
        // Format the data as JSON with highlights for filtered keys
        formatDataContent(content, log.data);
      } else {
        content.textContent = JSON.stringify(log.data, null, 2);
      }
      
      // Assemble log entry
      logElement.appendChild(timestamp);
      logElement.appendChild(content);
      
      return logElement;
    }
    
    // Format data content with highlighting
    function formatDataContent(container, data) {
      // Create a formatted string of the data as JSON
      try {
        // Use pre element for formatting
        const pre = document.createElement('pre');
        pre.style.margin = '0';
        pre.style.overflow = 'auto';
        pre.style.maxHeight = '200px';
        
        // Get JSON string
        const jsonString = JSON.stringify(data, null, 2);
        
        // Highlight filtered keys if any
        if (window.apiMonitor.filterKeys && window.apiMonitor.filterKeys.length > 0) {
          // Basic syntax highlighting
          let highlighted = jsonString
            .replace(/"([^"]+)":/g, '<span style="color: #f8c;">$&</span>') // keys
            .replace(/"[^"]*"/g, '<span style="color: #8f8;">$&</span>'); // string values
          
          // Highlight filtered keys
          window.apiMonitor.filterKeys.forEach(key => {
            const regex = new RegExp(`"(${key})":`, 'g');
            highlighted = highlighted.replace(regex, '<span style="color: #ff0; font-weight: bold;">$&</span>');
          });
          
          pre.innerHTML = highlighted;
        } else {
          // No highlighting
          pre.textContent = jsonString;
        }
        
        container.appendChild(pre);
      } catch (e) {
        // Fallback if formatting fails
        container.textContent = JSON.stringify(data);
      }
    }
    
    // Update the status bar
    function updateStatusBar() {
      const statusBar = document.getElementById('api-monitor-status');
      if (!statusBar) return;
      
      const status = window.apiMonitor.paused ? 'Paused' : 'Monitoring';
      const count = window.apiMonitor.messageCount;
      
      statusBar.innerHTML = `<span>${status}</span><span>${count} messages</span>`;
    }
    
    // Set up the message listeners to capture API calls
    function setupMessageListener() {
      // Intercept window.parent.postMessage calls
      const originalPostMessage = window.parent.postMessage;
      window.parent.postMessage = function(data, target) {
        // Call the original function
        originalPostMessage.apply(this, arguments);
        
        // Only process getData requests
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'getData') {
              logMessage('getData', parsed);
            }
          } catch (e) {
            // Not JSON or can't be parsed
          }
        } else if (data && data.type === 'getData') {
          logMessage('getData', data);
        }
      };
      
      // Listen for incoming messages (responses)
      window.addEventListener('message', function(event) {
        // Process responses
        if (event.data) {
          let data;
          
          // Handle string and object formats
          if (typeof event.data === 'string') {
            try {
              data = JSON.parse(event.data);
            } catch (e) {
              // Not valid JSON
              return;
            }
          } else {
            data = event.data;
          }
          
          // Log data responses 
          if (data) {
            logMessage('data', data);
          }
        }
      });
      
      // Create a button to trigger getData requests
      const requestButton = document.createElement('button');
      requestButton.textContent = 'Request Data';
      requestButton.style.position = 'fixed';
      requestButton.style.bottom = '10px';
      requestButton.style.right = '10px';
      requestButton.style.zIndex = '9998';
      requestButton.style.padding = '5px 10px';
      requestButton.style.backgroundColor = '#555';
      requestButton.style.color = 'white';
      requestButton.style.border = 'none';
      requestButton.style.borderRadius = '3px';
      requestButton.style.cursor = 'pointer';
      requestButton.onclick = function() {
        window.parent.postMessage({ type: "getData" }, "*");
      };
      
      document.body.appendChild(requestButton);
    }
    
    // Log a message to the monitor
    function logMessage(type, data) {
      if (window.apiMonitor.paused) return;
      
      // Skip position updates and other frequent updates to avoid flooding
      if (shouldSkipUpdate(data)) return;
      
      // Create timestamp
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      
      // Create log entry
      const logEntry = {
        timestamp: timestamp,
        type: type,
        data: data
      };
      
      // Add to logs
      window.apiMonitor.logs.push(logEntry);
      window.apiMonitor.messageCount++;
      
      // Keep logs limited
      if (window.apiMonitor.logs.length > 100) {
        window.apiMonitor.logs.shift();
      }
      
      // Update the display
      if (shouldShowLog(logEntry)) {
        const logContainer = document.getElementById('api-monitor-logs');
        logContainer.appendChild(createLogElement(logEntry));
        logContainer.scrollTop = logContainer.scrollHeight;
      }
      
      // Update status bar
      updateStatusBar();
    }
    
    // Check if this update should be skipped (to prevent flooding)
    function shouldSkipUpdate(data) {
      // Skip position updates and other frequent updates
      if (data.pos || data.position) {
        return true;
      }
      
      // Skip if the data hasn't changed from the last time
      const dataString = JSON.stringify(data);
      if (window.apiMonitor.lastSeenValues[dataString]) {
        return true;
      }
      
      // Remember this data
      window.apiMonitor.lastSeenValues[dataString] = true;
      
      // Keep lastSeenValues from growing too large
      const keys = Object.keys(window.apiMonitor.lastSeenValues);
      if (keys.length > 1000) {
        delete window.apiMonitor.lastSeenValues[keys[0]];
      }
      
      return false;
    }
    
    console.log('API Monitor initialized');
  });