const GeolocationModule = (function () {
    async function getGeoLocation() {
        return new Promise((resolve, reject) => {
            function onSuccess(position) {
                resolve(position.coords);
            }
            function onError(err) {
                reject(err);
            }
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(onSuccess, onError);
            } else {
                reject(
                    new Error("Geolocation is not supported by this browser")
                );
            }
        });
    }

    return {
        getGeoLocation,
    };
})();

const WeatherAPIModule = (function () {
    const WEATHER_API_KEY = "cc99b604e6c74dddb30164703240810";
    const GEOCODE_API_KEY = "e648d3463fa14394a69a9328c4a71255";

    async function getCityName({ latitude, longitude }) {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}%2C${longitude}&key=${GEOCODE_API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch the city name");
            const data = await response.json();
            return data.results.length > 0
                ? data.results[0]?.components?.town ||
                      data.results[0]?.components?.city
                : null;
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    async function getWeather(location) {
        const url = `https://api.weatherapi.com/v1/forecast.json?q=${location}&days=3&key=${WEATHER_API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch the weather");
            const data = await response.json();
            return data;
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    return {
        getCityName,
        getWeather,
    };
})();

const DOMManipulationModule = (function () {
    let isLoaded = false;
    const loader = document.getElementById("loader");
    const todayWeather = document.getElementById("todayWeather");
    const nextDaysWeatherCards = document.getElementById("nextDays");

    function displayTodayWeather(data) {
        const { current, location: weatherLocation } = data;
        const {
            temp_c,
            last_updated_epoch: epochTime,
            wind_kph: wind,
        } = current;
        const { daily_chance_of_rain: rain } = data.forecast.forecastday[0].day;
        const { name } = weatherLocation;
        const { icon, text: weatherStatus } = current.condition;

        const date = new Date(epochTime * 1000);
        const today = date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const [dayName, monthAndDay] = today.split(",");

        todayWeather.querySelector(".day-name").innerHTML = dayName.trim();
        todayWeather.querySelector(".date").innerHTML = monthAndDay;
        todayWeather.querySelector(".location-name").innerHTML = name;
        todayWeather.querySelector(
            ".degree"
        ).innerHTML = `${temp_c}<sup>o</sup>C`;
        todayWeather.querySelector(
            ".weather-icon"
        ).innerHTML = `<img src="${icon}" alt="alt" />`;
        todayWeather.querySelector(".weather-status").innerHTML = weatherStatus;
        todayWeather.querySelector(".rain").innerHTML = `${rain}%`;
        todayWeather.querySelector(".wind").innerHTML = `${wind}km/h`;
    }

    function displayNextDaysWeather(data) {
        const nextDayes = nextDaysWeatherCards.querySelectorAll(".next-days");
        if (
            data.forecast &&
            data.forecast.forecastday &&
            data.forecast.forecastday.length > 0
        ) {
            for (
                let index = 1;
                index < data.forecast.forecastday.length;
                index++
            ) {
                const { condition, maxtemp_c, mintemp_c } =
                    data.forecast.forecastday[index].day;
                const { icon, text: weatherStatus } = condition;
                const epochTime = data.forecast.forecastday[index].date_epoch;
                const date = new Date(epochTime * 1000);
                const today = date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
                const [dayName] = today.split(",");
                const day = nextDayes[index - 1];
                day.querySelector(".day-name").innerHTML = dayName.trim();
                day.querySelector(
                    ".weather-icon"
                ).innerHTML = `<img src="${icon}" alt="alt" />`;
                day.querySelector(
                    ".degree-max"
                ).innerHTML = `${maxtemp_c}<sup>o</sup>C`;
                day.querySelector(
                    ".degree-min"
                ).innerHTML = `${mintemp_c}<sup>o</sup>C`;
                day.querySelector(".weather-status").innerHTML = weatherStatus;
            }
        } else {
            console.log("No forecast data available");
        }

        if (!isLoaded) {
            isLoaded = true;
        }
    }

    function showAndHideMobileLinks() {
        const ulMobile = document.querySelector(".links-for-mobile");
        ulMobile.classList.toggle("active");
    }

    function hideLoader() {
        if (isLoaded) {
            setTimeout(() => {
                loader.style.display = "none";
                document.body.style.overflow = "auto";
            }, 1000);
        }
    }

    return {
        displayTodayWeather,
        displayNextDaysWeather,
        hideLoader,
        showAndHideMobileLinks,
    };
})();

const MainModule = (function (Geolocation, WeatherAPI, DOMManipulation) {
    async function displayCurrentLocationWeather() {
        try {
            const coords = await Geolocation.getGeoLocation();
            const city = await WeatherAPI.getCityName(coords);
            await displayWeather(city);
        } catch (err) {
            console.log(err);
            displayWeather("Cairo"); // ^ Default to Cairo if geolocation fails
        }
        DOMManipulationModule.hideLoader();
    }

    async function displayWeather(location) {
        const data = await WeatherAPI.getWeather(location);
        if (data?.current) {
            DOMManipulation.displayTodayWeather(data);
            DOMManipulation.displayNextDaysWeather(data);
        } else {
            displayCurrentLocationWeather();
        }
    }

    return {
        displayCurrentLocationWeather,
        displayWeather,
    };
})(GeolocationModule, WeatherAPIModule, DOMManipulationModule);

MainModule.displayCurrentLocationWeather();

// ^ On Search
const searchInput = document.getElementById("searchInput");
let debounceTimer;
searchInput.addEventListener("input", function (e) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const location = e.target.value;
        if (location) {
            MainModule.displayWeather(location);
        } else {
            MainModule.displayCurrentLocationWeather();
        }
    }, 1000);
});

// ^ On Click
const mobileLinksBar = document.querySelector(".bar");
mobileLinksBar.addEventListener("click", function () {
    DOMManipulationModule.showAndHideMobileLinks();
})
