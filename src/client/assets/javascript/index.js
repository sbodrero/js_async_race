// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
/**
 * Initialize default app props
 * @type {{player_id: undefined, track_id: undefined, race_id: undefined}}
 */
let store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

/**
 * Save new data to store
 * @param store
 * @param index
 * @param val
 */
const updateStore = (store, index, val) => store[index] = val

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad();
	setupClickHandlers();
});

/**
 * Get tracks, racers and updates dom
 * @returns {Promise<void>}
 */
async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks);
				renderAt('#tracks', html);
			})
			.catch(err => `Error while getting tracks from api ${err}`);

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers);
				renderAt('#racers', html);
			})
			.catch(err => `Error while getting racers from api ${err}`);
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message);
		console.error(error);
	}
}

/**
 * Attache error to dom
 * @param callback
 */
const showErrorMessage = (callback) => renderAt("#error", callback());

/**
 * Build error message
 * @returns {string}
 */
const buildErrorMessage = () => `
		<div class="error">Please make sur to select a pod and a player please</div>
	`;

/**
 * Check submitted values
 * @param callback
 * @returns {boolean}
 */
const checkSubmitterValues = (callback) => {
	if(getPlayeId(store) === undefined || getTrackId(store) === undefined) {
		showErrorMessage(buildErrorMessage);
		return false;
	}
	callback();
}


/**
 * Setup Click handlers
 */
function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event;

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target);
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target);
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault();
			// start race
			checkSubmitterValues(handleCreateRace);
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target);
		}

	}, false)
}

/**
 * Delay to wait dom
 * @param ms
 * @returns {Promise<unknown>}
 */
async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log(error);
	}
}

// ^ PROVIDED CODE ^ DO NOT REMOV
/**
 * Get the current player_id from store
 * @param player_id
 * @returns {*}
 */
const getPlayeId = ({ player_id }) => player_id;

/**
 * Get the current track_id from store
 * @param track_id
 * @returns {*}
 */
const getTrackId = ({track_id}) => track_id;

/**
 * Get the current _id race from store
 * @param race_id
 * @returns {*}
 */
const getRaceId = ({race_id}) => race_id -1;// hack https://github.com/udacity/nd032-c3-asynchronous-programming-with-javascript-project-starter/issues/6

/**
 * Create start and run the current race
 * @returns {Promise<void>}
 */
// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// render starting UI
	const playerId = getPlayeId(store);
	const trackId = getTrackId(store);

	createRace(playerId, trackId)
		.then(race => {
			const { ID, Track } = race;
			updateStore(store, 'race_id', ID);
			return Track;
		})
		.then(track => renderAt('#race', renderRaceStartView( track )))
		.then(async () => {
			try {
				await runCountdown();
			} catch (err) {
				console.log(err.toString());
			}
		})
		.then(async () => {
			try {
				await startRace(getRaceId(store));
			} catch (err) {
				console.log(err.toString());
			}
		})
		.catch(error => console.log(`There was an error starting the race from api ${error.toString()}` ))
		.then(() => runRace(getRaceId(store)))
		.catch(error => console.log(`Error while trying to run the race ${error.toString()}`))
		.catch(error => console.log(`Error while trying to create the race ${error.toString()}`));
}

/**
 * Update race progress dom element
 * @param progress
 */
const updateRaceProgress = (positions) => renderAt('#leaderBoard', raceProgress(positions));

/**
 * Update race positions view dom element
 * @param positions
 */
const upDateResultsView = (positions) => renderAt('#race', resultsView(positions));

/**
 * Run the current race
 * @param raceID
 * @returns {Promise<unknown>}
 */
function runRace(raceID) {
	try {
		return new Promise(resolve => {
			const raceInterval = setInterval(updateRaceInfos, 500);
			async function updateRaceInfos() {
				try {
					const race = await getRace(raceID);
					const { positions } = race;
					if(race?.status.toString() === 'in-progress') {
						return updateRaceProgress(positions);
					}
					clearInterval(raceInterval);
					upDateResultsView(positions);
					resolve(race);
				} catch (err) {
					console.log(err.toString());
				}
			}
		})
	} catch (error) {
		console.log(`There was an error while fetching runRace papi function ${error.toString()}`);
	}
}

/**
 * Update elemnent value
 * @param timer
 */
const updateTimer = (timer) => {
	document.getElementById('big-numbers').innerHTML =timer;
}

/**
 * Start race countDown
 * @returns {Promise<unknown>}
 */
async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000);
		let timer = 3;

		return new Promise(resolve => {
			const process = setInterval(countDown, 1000, timer);
			function countDown() {
				if(timer >= 0) {
					updateTimer(timer);
					return --timer;
				}
				clearInterval(process);
				resolve();
			}
		})
	} catch(error) {
		console.log(`There was an error running the countdown ${error}`);
	}
}

/**
 * Handle Select pod
 * @param target
 */
function handleSelectPodRacer(target) {
	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected');
	if(selected) {
		selected.classList.remove('selected');
	}

	// add class selected to current target
	target.classList.add('selected');

	updateStore(store, 'player_id', target.id);
}

/**
 * Handle select track
 * @param target
 */
function handleSelectTrack(target) {
	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected');

	if(selected) {
		selected.classList.remove('selected');
	}

	// add class selected to current target
	target.classList.add('selected');

	updateStore(store, 'track_id', target.id);
}

/**
 * Handle accelerate
 * @returns {Promise<Response | string>}
 */
function handleAccelerate() {
	try {
		return accelerate(getRaceId(store));
	} catch (err) {
		console.log(err);
	}
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

/**
 * Render cars dom element
 * @param racers
 * @returns {string}
 */
function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</h4>
		`;
	}

	const results = racers.map(renderRacerCard).join('');

	return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

/**
 * Render Racers dom element
 * @param racer
 * @returns {string}
 */
function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer;

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`;
}

/**
 * Render tracks cards
 * @param tracks
 * @returns {string}
 */
function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</h4>
		`;
	}

	const results = tracks.map(renderTrackCard).join('');

	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

/**
 * Render specific track card
 * @param track
 * @returns {string}
 */
function renderTrackCard(track) {
	const { id, name } = track;

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

/**
 * Render coundown
 * @param count
 * @returns {string}
 */
function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

/**
 * Render starting block
 * @param track
 * @returns {string}
 */
function renderRaceStartView(track) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

/**
 * Render results
 * @param positions
 * @returns {string}
 */
function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1);

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

/**
 * Render Progress
 * @param positions
 * @returns {string}
 */
function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === parseInt(getPlayeId(store)));
	userPlayer.driver_name += " (you)";

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1);
	let count = 1;

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	}).join('');

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

/**
 * Append data to a given dom element
 * @param element
 * @param html
 */
function renderAt(element, html) {
	const node = document.querySelector(element);
	node.innerHTML = html;
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000';

/**
 * Give a fetch init config
 * @returns {{mode: string, headers: {'Access-Control-Allow-Origin': string, 'Content-Type': string}}}
 */
function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints

/**
 * Fetch Tracks from api
 * @returns {Promise<Response | void>}
 */
function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${SERVER}/api/tracks`, {
		...defaultFetchOpts(),
	})
		.then(res => res.json())
		.catch(err => console.log(`There was an error ${err.toString()}`));
}

/**
 * Fetch racers from api
 * @returns {Promise<Response | void>}
 */
function getRacers() {
	// GET request to `${SERVER}/api/cars`
	return fetch(`${SERVER}/api/cars`, {
		...defaultFetchOpts(),
	})
		.then(res => res.json())
		.catch(err => console.log(`There was an error ${err.toString()}`));
}

/**
 * Ask race creation from api
 * @param player_id
 * @param track_id
 * @returns {Promise<Response | void>}
 */
function createRace(player_id, track_id) {
	player_id = parseInt(player_id);
	track_id = parseInt(track_id);
	const body = { player_id, track_id };

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err));
}

/**
 * Get specific race informations
 * @param id
 * @returns {Promise<Response | void>}
 */
function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	return fetch(`${SERVER}/api/races/${id}`, {
		method: 'GET',
		...defaultFetchOpts(),
	})
		.then(res => res.json())
		.catch(err => console.log("Problem with getting request::", err));
}

/**
 * Launch race
 * @param race_id
 * @returns {Promise<void>}
 */
function startRace(race_id) {
	const id = parseInt(race_id);
	const body = { race_id };
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body),
	})
	.catch(err => console.log("Problem with getRace request::", err))
}

/**
 * Accelerate car
 * @param id
 * @returns {Promise<Response | string>}
 */
function accelerate(id) {
	return fetch(`${SERVER}/api/races/${id}/accelerate`,{
		method: 'POST',
		...defaultFetchOpts()
		})
		.catch(error => `There was an error while calling accelertae api function ${error}`);
}
