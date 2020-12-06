// Vars to be used
var mainNavListEl = document.getElementById('mainnavlist');
var selectboxEl = document.getElementById('searchlan');
var mainSection = document.getElementById('info');
var jobLimit = document.getElementById('numrows');
var itCheckbox = document.getElementById('onlyit');
var searchField = document.getElementById('searchText');
var searchBtn = document.getElementById('searchbutton');

var regionID = 10; //global variable for keeping tabs on län ID. Default is 10 (blekinge län) for initial content on website load.

// Eventlisteners
window.addEventListener("load", init, false);
mainNavListEl.addEventListener("click", getJobs, false);
selectboxEl.addEventListener("change", getJobs, false);
jobLimit.addEventListener("change", getJobs, false);
itCheckbox.addEventListener("change", getJobs, false);
searchBtn.addEventListener("click", getJobs, false);

// Initiate AJAX call with URL as API string and callback for handling returned data.
function makeCall(apiURL, callback){
    var xhttp = new XMLHttpRequest();

    // Whenever AJAX state changes, check if call is finished and no errors encountered. When finished run callback function to do stuff with data.
    xhttp.onreadystatechange = function(){
        if(xhttp.readyState == 4 && xhttp.status == 200){
            callback(xhttp.responseText);
        }
    }
    xhttp.open("GET", apiURL, true);
    xhttp.send();
}

// Load on window load.
function init(){
    makeCall('http://api.arbetsformedlingen.se/af/v0/platsannonser/soklista/lan', printRegions);
    makeCall('http://api.arbetsformedlingen.se/af/v0/platsannonser/matchning?lanid=10', printJobs); // Print blekinge län as initial content on website load/reload.
}

// Get jobs on click
function getJobs(e){
    var limit = jobLimit.value;
    var checkBox = itCheckbox.checked;
    var searchString = searchField.value;
    
     if (e.target.tagName.toLowerCase() === 'li'){ // Get ID if jobs were requested via list item click
        regionID = e.target.id;
    }

    if(e.target.tagName.toLowerCase() === 'select'){ // Get value if jobs were requested via select
        regionID = e.target.value;
    }

    // If "alla län" is selected and searchfield is NOT empty or null. Set URL to search all regions.
    // if "alla län" is not selected set URL to selected län for search.
    if(regionID == '100'){
        apiURL = 'http://api.arbetsformedlingen.se/af/v0/platsannonser/matchning?antalrader=' + limit;
    }else{ 
        apiURL = 'http://api.arbetsformedlingen.se/af/v0/platsannonser/matchning?lanid=' + regionID + '&antalrader=' + limit;
    }

    // Get only-IT checkbox value
    if(checkBox === true){ 
        apiURL += '&yrkesomradeid=3';
    }

    // Check if searchfield has content then append to search.
    if(searchString != null && searchString != ""){ 
        apiURL += '&nyckelord=' + searchString;
    }    

    // If regionID is 100 and has string OR if regionID is not 100, do ajax call. Else do nothing.
    // (This way, if user selects "alla län" and has no searchstring it won't throw an error.)
    if(regionID == '100' && searchString != null && searchString != "" || regionID != '100'){
        makeCall(apiURL, printJobs);
    }
}

// Prints out jobs
function printJobs(ajaxResponse){
    var json = JSON.parse(ajaxResponse);
    var regionListings = json.matchningslista.matchningdata; // Default path
    mainSection.innerHTML = ""; // Clear previous results

    // If there is no data to be found, print an error. Else continue on and print all jobs.
    if(regionListings === undefined){
        mainSection.innerHTML = "Inga lediga jobb hittade baserade på angivna filter.";
    }else{
        for (var i = 0; i < regionListings.length; i++){

            // Store values in array for undefined value check
            var valueStack = [ 
            regionListings[i].annonsrubrik,
            regionListings[i].yrkesbenamning, 
            regionListings[i].arbetsplatsnamn, 
            regionListings[i].anstallningstyp, 
            regionListings[i].antalplatser, 
            regionListings[i].publiceraddatum, 
            regionListings[i].sista_ansokningsdag,
            regionListings[i].kommunnamn
            ];

            checkUndefined(valueStack); // Check for undefined values

            // Store all values in dev-friendly vars after check.
            var listingName = valueStack[0];
            var occupation = valueStack[1];
            var company = valueStack[2];
            var employmentType = valueStack[3];
            var positions = valueStack[4];
            var publishedDate = valueStack[5];
            var lastDate = valueStack[6];
            var city = valueStack[7];

            // Fix timestamps format from "2017-10-21T07:02:07+02:00" to yyyy-mm-dd
            // Check for a beginning 2 (2yyymmdd). Otherwise value was not defined and has "N/A"-string attached.
            if(publishedDate.substring(0, 1) == "2"){
                publishedDate = publishedDate.slice(0, 10);
            }
            if(lastDate.substring(0, 1) == "2"){
                lastDate = lastDate.slice(0, 10);
            }

            // Print out
            mainSection.innerHTML +=
            "<article>" +
                "<h3>" + listingName + "</h3>" +
                "<h4>" + occupation + "</h4>" +
                "<p>" + 
                    "<strong>Kommun: </strong>" + city +
                    "<br>" +
                    "<strong>Arbetsgivare: </strong>" + company +
                    "<br>" +
                    "<strong>Anställningstyp: </strong>" + employmentType +
                    "<br>" +
                    "<strong>Antal Platser: </strong>" + positions  +
                    "<br>" +
                    "<strong>Publiceringsdatum: </strong>" + publishedDate +
                    "<br>" +
                    "<strong>Sista Ansökningsdag: </strong>" + lastDate +
                "</p>" +
                "<p>" + 
                    "<a href=" + regionListings[i].annonsurl + " target='_blank' class='btn'>Läs mer</a>" +
                "</p>" +
            "</article>";
        }
    }
}

// Print regions to document
function printRegions(ajaxResponse){
    var json = JSON.parse(ajaxResponse);
    var region = json.soklista.sokdata; // Default path

    for(var i = 0; i < region.length; i++ ){
        mainNavListEl.innerHTML += '<li id=' + region[i].id + '>' + region[i].namn + ' (' + region[i].antal_platsannonser + ')' + '</li>'; //Print sidenav regions
        selectboxEl.innerHTML += '<option value=' + region[i].id + '>' + region[i].namn + '</option>'; //Print selectbox regions
    }
        selectboxEl.innerHTML += '<option value=100>' + 'Alla Län' + '</option>'; // Add all län
}

// Check for undefined values and add string to those.
function checkUndefined(array){
    for(var i = 0; i < array.length; i++){
        if(array[i] == undefined){
            array[i] = "Ej tillgänglig data";
        }
    }    
}
