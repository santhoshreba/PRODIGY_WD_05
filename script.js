document.addEventListener('DOMContentLoaded', function() {
    const apiKey = 'bd5e378503939ddaee76f12ad7a97608'; // Replace with your OpenWeatherMap API key
    const searchBtn = document.getElementById('search-btn');
    const currentLocationBtn = document.getElementById('current-location-btn');
    const locationInput = document.getElementById('location-input');
    const weatherInfo = document.getElementById('weather-info');
    const forecastContainer = document.getElementById('forecast-container');
    const body = document.body;
    
    // Initialize with default city
    fetchWeatherByCity('London');
    
    // Event listeners
    searchBtn.addEventListener('click', function() {
        const location = locationInput.value.trim();
        if (location) {
            fetchWeatherByCity(location);
        }
    });
    
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const location = locationInput.value.trim();
            if (location) {
                fetchWeatherByCity(location);
            }
        }
    });
    
    currentLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude);
                },
                error => {
                    showError("Unable to retrieve your location. Please enter a city name.");
                }
            );
        } else {
            showError("Geolocation is not supported by your browser. Please enter a city name.");
        }
    });
    
    // Fetch weather by city name
    async function fetchWeatherByCity(city) {
        try {
            showLoading();
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('City not found');
            }
            
            const data = await response.json();
            displayWeather(data);
            fetchForecast(data.coord.lat, data.coord.lon);
            updateTheme(data.weather[0].main, data.dt, data.timezone);
        } catch (error) {
            showError("City not found. Please try another location.");
        }
    }
    
    // Fetch weather by coordinates
    async function fetchWeatherByCoords(lat, lon) {
        try {
            showLoading();
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            
            const data = await response.json();
            displayWeather(data);
            fetchForecast(lat, lon);
            updateTheme(data.weather[0].main, data.dt, data.timezone);
        } catch (error) {
            showError("Unable to fetch weather data for your location.");
        }
    }
    
    // Fetch 5-day forecast
    async function fetchForecast(lat, lon) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Forecast not available');
            }
            
            const data = await response.json();
            displayForecast(data);
        } catch (error) {
            console.error("Error fetching forecast:", error);
        }
    }
    
    // Display current weather
    function displayWeather(data) {
        const { name, sys } = data;
        const { temp, humidity, feels_like, temp_min, temp_max } = data.main;
        const { speed, deg } = data.wind;
        const { description, icon, main } = data.weather[0];
        
        weatherInfo.innerHTML = `
            <div class="location">${name}, ${sys.country}</div>
            <img class="weather-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
            <div class="temp">${Math.round(temp)}°C</div>
            <div class="description">${description}</div>
            <div class="details">
                <div class="detail-item">
                    <div>Feels Like</div>
                    <div>${Math.round(feels_like)}°C</div>
                </div>
                <div class="detail-item">
                    <div>Humidity</div>
                    <div>${humidity}%</div>
                </div>
                <div class="detail-item">
                    <div>Wind</div>
                    <div>${speed} m/s</div>
                </div>
                <div class="detail-item">
                    <div>Min/Max</div>
                    <div>${Math.round(temp_min)}°/${Math.round(temp_max)}°</div>
                </div>
            </div>
        `;
    }
    
    // Display 5-day forecast
    function displayForecast(data) {
        // Get daily forecast (API returns 3-hour intervals, we'll take one per day)
        const dailyForecast = data.list.filter((item, index) => index % 8 === 0);
        
        forecastContainer.innerHTML = dailyForecast.map(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            const { temp } = day.main;
            const { icon } = day.weather[0];
            
            return `
                <div class="forecast-item">
                    <div class="forecast-day">${dayName}</div>
                    <img class="forecast-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${day.weather[0].description}">
                    <div class="forecast-temp">${Math.round(temp)}°</div>
                </div>
            `;
        }).join('');
    }
    
    // Update theme based on weather and time
    function updateTheme(weatherCondition, timestamp, timezone) {
        // Remove all weather classes first
        body.classList.remove('sunny', 'rainy', 'cloudy', 'night');
        
        // Calculate local time at location
        const localTime = new Date((timestamp + timezone) * 1000);
        const hours = localTime.getUTCHours();
        
        // Determine if it's night (between 6pm and 6am)
        const isNight = hours < 6 || hours >= 18;
        
        if (isNight) {
            body.classList.add('night');
        } else {
            switch (weatherCondition.toLowerCase()) {
                case 'clear':
                    body.classList.add('sunny');
                    break;
                case 'rain':
                case 'drizzle':
                case 'thunderstorm':
                    body.classList.add('rainy');
                    break;
                case 'clouds':
                case 'mist':
                case 'smoke':
                case 'haze':
                case 'fog':
                    body.classList.add('cloudy');
                    break;
                default:
                    // Default theme
                    break;
            }
        }
    }
    
    // Show loading state
    function showLoading() {
        weatherInfo.innerHTML = '<div class="loading">Loading weather data...</div>';
        forecastContainer.innerHTML = '';
    }
    
    // Show error message
    function showError(message) {
        weatherInfo.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
        forecastContainer.innerHTML = '';
    }
});