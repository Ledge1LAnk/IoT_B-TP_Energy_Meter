// Constants for thresholds
const CARBON_LIMIT_KG = 400.0;
const CO2_PPM_THRESHOLD = 2000.0;

let dataTimeoutHandle;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDulSyTqydqL3n8WwY0KAqa9dgVSP3BQiE",
  authDomain: "iyanu-cfp-meter.firebaseapp.com",
  databaseURL: "https://iyanu-cfp-meter-default-rtdb.firebaseio.com",
  projectId: "iyanu-cfp-meter",
  storageBucket: "iyanu-cfp-meter.firebasestorage.app",
  messagingSenderId: "349401483580",
  appId: "1:349401483580:web:bd66935087755c80e8f639"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const connectionStatus = document.getElementById('connectionStatus');

// Connection state monitoring
firebase.database().ref('.info/connected').on('value', (snapshot) => {
  if (snapshot.val() === true) {
    connectionStatus.classList.add('connected');
    connectionStatus.querySelector('span').textContent = 'Connected';
  } else {
    connectionStatus.classList.remove('connected');
    connectionStatus.querySelector('span').textContent = 'Disconnected';
  }
});

// Data storage for charts
let allEnergyData = [];
let allCarbonData = [];
let currentEnergyRange = 24; // hours for energy chart
let currentCarbonRange = 24; // hours for carbon chart

// Initialize charts
const energyCtx = document.getElementById("energyChart").getContext("2d");
const carbonCtx = document.getElementById("carbonChart").getContext("2d");

// Energy Chart
const energyChart = new Chart(energyCtx, {
  type: 'line',
  data: {
    datasets: [{
      label: 'Energy (kWh)',
      data: [],
      borderColor: '#00b8ff',
      backgroundColor: 'rgba(0, 184, 255, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointBackgroundColor: '#00b8ff',
      pointHoverRadius: 5
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#aaa',
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Time',
          color: '#aaa',
          font: {
            size: 13
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#aaa',
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Energy (kWh)',
          color: '#aaa',
          font: {
            size: 13
          }
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          boxWidth: 0,
          font: {
            size: 13
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#00b8ff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            return 'Energy Usage';
          },
          label: function(context) {
            return `Energy: ${context.parsed.y.toFixed(3)} kWh`;
          }
        }
      }
    }
  }
});

// Update energy chart with time filter
function updateEnergyChart() {
  const now = Date.now();
  const maxAge = currentEnergyRange * 60 * 60 * 1000; // Convert to milliseconds
  
  // Filter data based on current time range
  const filteredData = allEnergyData.filter(point => now - point.x <= maxAge);
  
  // Update chart
  energyChart.data.datasets[0].data = filteredData;
  energyChart.update();
}

// Time range selectors for energy chart
document.querySelectorAll('#energy-range .time-range-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#energy-range .time-range-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentEnergyRange = parseInt(this.dataset.range);
    updateEnergyChart();
  });
});

// Carbon Chart
const carbonChart = new Chart(carbonCtx, {
  type: 'line',
  data: {
    datasets: [{
      label: 'Carbon Emission (kg CO2e)',
      data: [],
      borderColor: '#00ff9d',
      backgroundColor: 'rgba(0, 255, 157, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointBackgroundColor: '#00ff9d',
      pointHoverRadius: 5
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#aaa',
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Time',
          color: '#aaa',
          font: {
            size: 13
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#aaa',
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Carbon (kg CO2e)',
          color: '#aaa',
          font: {
            size: 13
          }
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          boxWidth: 0,
          font: {
            size: 13
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#00ff9d',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            return 'Carbon Emissions';
          },
          label: function(context) {
            return `Carbon: ${context.parsed.y.toFixed(3)} kg CO2e`;
          }
        }
      }
    }
  }
});

// Update carbon chart with time filter
function updateCarbonChart() {
  const now = Date.now();
  const maxAge = currentCarbonRange * 60 * 60 * 1000; // Convert to milliseconds
  
  // Filter data based on current time range
  const filteredData = allCarbonData.filter(point => now - point.x <= maxAge);
  
  // Update chart
  carbonChart.data.datasets[0].data = filteredData;
  carbonChart.update();
}

// Time range selectors for carbon chart
document.querySelectorAll('#carbon-range .time-range-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#carbon-range .time-range-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentCarbonRange = parseInt(this.dataset.range);
    updateCarbonChart();
  });
});

// Update system status display
function updateSystemStatus(relayState, carbonEmission, airQuality) {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');
  const carbonStatus = document.getElementById('carbonStatus');
  const airStatus = document.getElementById('airStatus');
  
  // Calculate carbon footprint status
  const carbonFootprint = carbonEmission > CARBON_LIMIT_KG ? 'danger' : 'safe';
  const airFootprint = airQuality > CO2_PPM_THRESHOLD ? 'danger' : 'safe';
  
  // Set status badge colors
  carbonStatus.className = `carbon-badge ${carbonFootprint === 'danger' ? 'danger' : 'safe'}`;
  airStatus.className = `carbon-badge ${airFootprint === 'danger' ? 'danger' : 'safe'}`;
  
  if (!relayState) {
    // System is off
    statusIndicator.style.borderColor = '#6666ff';
    statusIndicator.style.transform = 'rotate(0deg)';
    statusTitle.textContent = "System Off";
    statusMessage.textContent = "Turned Off";
    statusTitle.style.background = 'linear-gradient(90deg, #6666ff, #6666ff)';
  } else if (carbonFootprint === 'safe' && airFootprint === 'safe') {
    // System on and safe
    statusIndicator.style.borderColor = '#00cc66';
    statusIndicator.style.transform = 'rotate(180deg)';
    statusTitle.textContent = "System On";
    statusMessage.textContent = "Carbon Footprint Okay";
    statusTitle.style.background = 'linear-gradient(90deg, #00cc66, #00cc66)';
  } else {
    // System on but footprint high
    statusIndicator.style.borderColor = '#ffcc00';
    statusIndicator.style.transform = 'rotate(90deg)';
    statusTitle.textContent = "System On";
    statusMessage.textContent = "Carbon Footprint High";
    statusTitle.style.background = 'linear-gradient(90deg, #ffcc00, #ffcc00)';
    
    // If either is in danger, show warning
    if (carbonFootprint === 'danger' || airFootprint === 'danger') {
      statusIndicator.style.borderColor = '#ff3333';
      statusTitle.textContent = "System Off";
      statusMessage.textContent = "Carbon Footprint High";
      statusTitle.style.background = 'linear-gradient(90deg, #ff3333, #ff3333)';
    }
  }
}

// Reset all displayed values
function resetDisplay() {
  document.getElementById('voltage').textContent = "0.00";
  document.getElementById('current').textContent = "0.00";
  document.getElementById('power').textContent = "0.00";
  document.getElementById('energy').textContent = "0.000";
  document.getElementById('frequency').textContent = "0.00";
  document.getElementById('powerFactor').textContent = "0.00";
  document.getElementById('carbonEmission').textContent = "0.00";
  
  // Update status to indicate no data
  document.getElementById('statusTitle').textContent = "No Data";
  document.getElementById('statusMessage').textContent = "Device disconnected or not responding";
  document.getElementById('statusIndicator').style.borderColor = '#aaaaaa';
  document.getElementById('statusTitle').style.background = 'linear-gradient(90deg, #aaaaaa, #aaaaaa)';
  document.getElementById('carbonStatus').className = "carbon-badge";
  document.getElementById('airStatus').className = "carbon-badge";
  
  // Clear charts
  energyChart.data.datasets[0].data = [];
  carbonChart.data.datasets[0].data = [];
  energyChart.update();
  carbonChart.update();
}

// Listen for realtime data updates
database.ref('smart_meter').on('value', (snapshot) => {
  const data = snapshot.val();
  if (data) {
    // Reset the timeout on new data
    if (dataTimeoutHandle) {
      clearTimeout(dataTimeoutHandle);
    }
    
    // Set new timeout
    dataTimeoutHandle = setTimeout(() => {
      resetDisplay();
    }, 30000); // 30 seconds
    
    // Update values with correct field names
    document.getElementById('voltage').textContent = data.voltage.toFixed(2);
    document.getElementById('current').textContent = data.current.toFixed(2);
    document.getElementById('power').textContent = data.power.toFixed(2);
    document.getElementById('energy').textContent = data.energy.toFixed(3); // Fixed field name
    document.getElementById('frequency').textContent = data.frequency.toFixed(2);
    document.getElementById('powerFactor').textContent = data.power_factor.toFixed(2);
    document.getElementById('carbonEmission').textContent = data.co2_emission_kg.toFixed(3);
    
    const timestamp = Date.now();
    
    // Add new energy data point
    allEnergyData.push({
      x: timestamp,
      y: data.energy // Fixed field name
    });

    allCarbonData.push({
      x: timestamp,
      y: data.co2_emission_kg
    });
    
    // Update chart
    updateEnergyChart();
    updateCarbonChart();
    
    // Update system status
    updateSystemStatus(data.relay_state, data.co2_emission_kg, data.mq2_ppm);
    updateMainsStatus(data.relay_state, data.co2_emission_kg, data.mq2_ppm);
  }
});

// Create relay control
// Mains status display
const mainsStatusCard = document.getElementById('mainsStatusCard');
const mainsStatusMessage = document.getElementById('mainsStatusMessage');

function updateMainsStatus(relayState, carbonEmission, airQuality) {
  const carbonFootprint = carbonEmission > CARBON_LIMIT_KG;
  const airFootprint = airQuality > CO2_PPM_THRESHOLD;
  
  if (!relayState) {
    // System is off
    mainsStatusCard.classList.remove('active');
    mainsStatusMessage.textContent = "Turned Off";
    mainsStatusCard.querySelector('.power-icon').style.color = '#ff3333';
  } else if (carbonFootprint || airFootprint) {
    // Threshold reached - should be off
    mainsStatusCard.classList.remove('active');
    mainsStatusMessage.textContent = "Turned Off (Threshold Reached)";
    mainsStatusCard.querySelector('.power-icon').style.color = '#ff3333';
  } else {
    // System on and within thresholds
    mainsStatusCard.classList.add('active');
    mainsStatusMessage.textContent = "Turned On";
    mainsStatusCard.querySelector('.power-icon').style.color = '#00ff9d';
  }
}

// Update the updateSystemStatus function call to also update mains status
database.ref('smart_meter').on('value', (snapshot) => {
  const data = snapshot.val();
  if (data) {
    // ... (keep existing code)
    
    // Update system status and mains status
    updateSystemStatus(data.relay_state, data.co2_emission_kg, data.mq2_ppm);
    updateMainsStatus(data.relay_state, data.co2_emission_kg, data.mq2_ppm);
  }
});

// Load previous data
function loadHistoricalData() {
  const historyRef = database.ref('history');
  historyRef.once('value', snapshot => {
    const data = snapshot.val();
    if (!data) return;
    
    allEnergyData = [];
    allCarbonData = [];

    Object.entries(data).forEach(([key, value]) => {
      const timestamp = parseInt(key) * 1000; // convert seconds to ms
      allEnergyData.push({ x: timestamp, y: value.energy });
      allCarbonData.push({ x: timestamp, y: value.co2_emission_kg });
    });

    // Update chart with historical data
    updateEnergyChart();
    updateCarbonChart();
  });
}

// Call to load previous data
loadHistoricalData();

// Initialize timeout for data reset
dataTimeoutHandle = setTimeout(() => {
  resetDisplay();
}, 30000);
