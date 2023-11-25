//--20224612_cse2wdx_assignment3--
//This app requests data from openweathermap.org by using 5-day forecast API and device coordinates from W3C Geolocation.
//Forecast summary table and a temperature chart are created as specified by the assessment criteria.
// This JS file controls functionality of the app, inserts interactive HTML text nodes, creates forecast table and chart and formats the chart using chart.js API. 

//***************************************** GLOBAL VARIABLES ******************************************
const apiKey = '757cacbac90d301510b45877056105e7';
const apiUrl = 'http://api.openweathermap.org/data/2.5/forecast';

//a new API from 251123:
//const apiUrl = 'http://api.openweathermap.org/data/3.0/onecall?';
//const apiKey = '87204891914695dac1c76f2e39991ee8';

const degC = '\u00A0\u2103';//a degC code for forecast table entries
let locationName;
let urlForecast;//API url string
let forecasts;//list of data objects created from JSON entries

let locatingMessage = document.getElementById("locationMessage");
locatingMessage.textContent = "Locating...";

document.getElementById("welcomeScreen").style.display = "none";//hide incomplete elements on the starting screen
document.getElementById("forecast").style.display = "none";

//in the following step, the user is required to authorise device location access by clicking "allow" button in the prompt window.
navigator.geolocation.getCurrentPosition(success, error);//return the current position of the device.


//******************************************* FUNCTIONS ************************************************r

//Function to prevent code injection by verifying that coordinates are float values.
function sanitizeCoordinate(coordinates) {
    const sanitizedCoordinates = parseFloat(coordinates);
    if (isNaN(sanitizedCoordinates)) {
        throw new Error("Invalid coordinate value");
    }
    return sanitizedCoordinates;
}

//success parameter/evaluation of geolocation API
function success(position) {
    //return geolocation coordinates after checking if they are float values
    latitude = sanitizeCoordinate(position.coords.latitude);
    longitude = sanitizeCoordinate(position.coords.longitude);

    //concatenate URL for openweathermap API
    urlForecast =
        apiUrl +
        '?lat=' +
        latitude +
        '&lon=' +
        longitude +
        '&cnt=32&&units=metric' +
        '&appid=' +
        apiKey;

    //create welcome screen, insert coordinates into HTML text elements.
    document.getElementById("welcomeScreen").style.display = "block";
    let lat = document.getElementById("lat");
    let lon = document.getElementById("lon");
    lat.textContent = "Latitude: " + latitude;
    lon.textContent = "Longitude: " + longitude;

}

//error parameter/evaluation of geolocation API
function error() {
    errorMessage.textContent = "Unable to retrieve your location. Reload this page and click 'Allow' to enable geolocation.";
}

//AJAX request handling, activated as onclick event of the "Get Weather" button of the welcomne screen
async function getForecast() {
    try {
        //hide welcome screen and display contents of forecast div
        document.getElementById("welcomeScreen").style.display = "none";
        document.getElementById("forecast").style.display = "block";

        //asynchronous request sent to openweather.org incl error handling
        const response = await fetch(urlForecast)
        if (!response.ok) {
            const error = new Error("Cannot fetch weather");
            error.statusCode = 500;
            throw error;
        }
        const data = await response.json();//receive json response

        //parse json data as list of objects
        forecasts = data.list;
        locationName = data.city.name;//extract location name and insert it in HTML locationName element
        locatingMessage.textContent = "For " + locationName;

        //call table and chart funcions to present the data.
       
               console.log('Forecasts Array:', forecasts);
              

        printChart(forecasts);

        setTimeout(() => {
            printTable(); // Call the function after the delay
        }, 1000); // 1000 milliseconds = 1 second
       // printTable(forecasts);
    } catch (err) {
        console.log(err);
    }
}

//Funcion displaying data nodes as table entries.
function printTable() {
    const table = document.getElementById("forecastTable");
    const days = {};//create empty data object

    //iterate through 32 objects in forecast list
    //extract date, time and weather information from each object
    forecasts.forEach(function (forecast) {
        const date = new Date(forecast.dt * 1000);//Date constructor, using Unix to Javascript time convertion
        const day = date.toLocaleDateString('en-AU');//convert date to short local format
        const hour = date.getHours();
       
        if (!days[day]) {//create days{} objects for all dates (day) in the forecast
            days[day] = {};
        }

        days[day][hour] = {//create nested days{} objects for every hour of all dates (day) in the forecast
            temp: forecast.main.temp,
           // icon: forecast.weather[0].icon,
           // description: forecast.weather[0].description
        };

    });

    Object.entries(days).forEach(function([day, time]){//iterate through each days{}
        const row = document.createElement('tr');
        const dateCell = document.createElement('td');
        dateCell.textContent = day;
        row.appendChild(dateCell);//place a forecast date in first cell of each created row

        for (let i = 1; i <9; i++) {
            const hour = i * 3 - 2;//generate 8 values of hour to match hours of the forecast
            const dataCell = document.createElement('td');//create blank table cells for 8 hour colunms

            //for each hour value in each of day rows, extract temperature, image url and description from JASON
            if (time[hour]) {
                const temp = document.createElement('p');
                temp.textContent = time[hour].temp + degC;
                const icon = document.createElement('img');
                const iconFile = time[hour].icon;
                icon.src = 'https://openweathermap.org/img/w/'+iconFile+'.png';
                icon.alt = "Image not available";
                const description = document.createElement('p');
                description.textContent = time[hour].description;

                //append cell data nodes
                dataCell.appendChild(temp);
                dataCell.appendChild(icon);
                dataCell.appendChild(description);
            }

            row.appendChild(dataCell);// add new cell to row (one for each of 8 iterations)
        }

        table.appendChild(row); //add new row
    });
}

//function displaying daily temperature trends as line charts. Data is based on global forecasts data list
function printChart(forecasts) {
    //create data object structure containing arrays of labels and data sets
    const data = {
        labels: [],
        datasets: []
    };

    const days = {};
    const hours = {};

    forecasts.forEach(function (forecast) {
        const date = new Date(forecast.dt * 1000);//Date constructor, using Unix to Javascript time convertion
        const day = date.toLocaleDateString('en-AU');//convert date to short local date format
        const hour = date.getHours();

        //create day/hour data arrays
        if (!days[day]) {
            days[day] = [];
        }
        if (!hours[hour]) {
            hours[hour] = [];
        }

        //add forecast temperature values to the end of each data array
        days[day].push(forecast.main.temp);
        hours[hour].push(forecast.main.temp);
    });//more work is required (create array(8) for each day where missing temperatures are presented as null)

    const colourPalette = ['red', 'orange', 'yellow', 'green', 'blue'];// colour palette that differentiates dates
    Object.entries(days).forEach(function ([day, temps], index) {
        const colour = colourPalette[index];
        data.datasets.push({// add data object elements including colour for each of the days
            label: day,
            data: temps,
            borderColor: colour,
            fill: false
        });
    });

    data.labels = Object.keys(hours).map(function (hour) {//create labels for X Axis as an array of strings
        return hour.toString();
    });

    //plot chart elements using chart.js syntax
    const canvas = document.getElementById('chart');
    const elements = canvas.getContext('2d');
    const chart = new Chart(elements, {
        type: 'line',
        data: data,

        options: {
            title: {
                display: true,
                text: 'Daily Temperature',
                fontColor: 'black',
                fontSize: 16
            },
            scales: {
                
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Time, hrs',
                        fontColor: 'black',
                        fontSize: 12
                    },
                    ticks: {
                        autoSkip: false,
                        maxTicksLimit: 8,
                        stepSize: 1,
                        fontColor: 'black',
                        fontSize: 12
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: false,
                        fontColor: 'black',
                        fontSize: 12
                    }
                }]
            },
            legend: {
                display: true,
                labels: {
                    fontColor: 'black',
                    fontSize: 12
                }
                
            }
        }
    });
}
