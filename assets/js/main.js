// ^ get html elements
const todayWeather = document.getElementById("todayWeather");
const nextDaysWeatherCards = document.getElementById("nextDays");
const searchInput = document.getElementById("seacrhInput");

// !========== i can't use Async&Await in this function ====================
function getGeoLocation() {
    return new Promise((resolve, reject) => {
        function onSuccess(position) {
            resolve(getCityName(position.coords));
        }
        function onError(err) {
            reject(err);
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(onSuccess, onError);
        }
    });
}

async function getCityName(position) {
    const { latitude, longitude } = position;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}%2C${longitude}&key=e648d3463fa14394a69a9328c4a71255`;
    const response = await fetch(url);
    const data = await response.json();
    const currentCityOrTown =
        data.results[0].components?.town || data.results[0].components?.city;
    return currentCityOrTown;
}

async function getWeather(location) {
    let url = `http://api.weatherapi.com/v1/forecast.json?q=${location}&days=3&key=cc99b604e6c74dddb30164703240810`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

function clearCards() {
    todayWeather.innerHTML = "";
    nextDaysWeatherCards.innerHTML = "";
}

async function displayWeather(location) {
    const data = await getWeather(location);
    const displayToday = () => {
        const { current, location: weatherLocation } = data;
        const { temp_c, last_updated_epoch: epochTime } = current;
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
        console.log();
        console.log();

        todayWeather.innerHTML = `
        <div class="header">
            <div class="day-name">${dayName}</div>
            <div class="date">${monthAndDay.trim()}</div>
        </div>
        <div class="body">
            <div class="location-name">${name}</div>
            <div class="degree">${temp_c + "<sup>o</sup>C"}
            </div>
            <div class="weather-icon">
                <img src="${icon}" alt="alt" />
            </div>
            <div class="weather-status">${weatherStatus}</div>
            <div class="other-info">Wind: 6 km/h</div>
        </div>
        `;
    };
    const displayNextDays = () => {
        for (let index = 1; index < data.forecast.forecastday.length; index++) {
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

            nextDaysWeatherCards.innerHTML += `
            <div class="card next-days">
                <div class="header">
                    <div class="day-name">${dayName.trim()}</div>
                </div>
                <div class="body">
                    <div class="weather-icon">
                        <img
                            src="${icon}"
                            alt="alt"
                        />
                    </div>
                    <div class="degree-max">${maxtemp_c + "<sup>o</sup>C"}</div>
                    <div class="degree-min">${mintemp_c + "<sup>o</sup>C"}</div>
                    <div class="weather-status">${weatherStatus}</div>
                </div>
            </div>
            `;
        }
    };

    if (data?.current) {
        clearCards();
        displayToday();
        displayNextDays();
    } else {
        clearCards();
        displayWeather("cairo");
    }
}

async function displayCurrentLocationWeather() {
    try {
        const location = await getGeoLocation();
        await displayWeather(location);
    } catch (err) {
        console.log(err);
        displayWeather("cairo");
    }
}

displayCurrentLocationWeather();

searchInput.addEventListener("input", function (e) {
    displayWeather(this.value);
});
