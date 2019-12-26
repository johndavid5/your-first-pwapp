/*
 * @license
 * Your First PWA Codelab (https://g.co/codelabs/pwa)
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */
'use strict';

// CODELAB: Update cache names any time any of the cached files change...
// ...this will cause the caches to re-load with fresh stuff...
const CACHE_NAME = 'static-cache-v3';
const DATA_CACHE_NAME = 'data-cache-v1';

// CODELAB: Add list of files to cache here.
const FILES_TO_CACHE = [
  //'/weather-pwa/offline.html' -- don't need offline page anymore
  '/weather-pwa/',
  '/weather-pwa/index.html',
  '/weather-pwa/scripts/app.js',
  '/weather-pwa/scripts/install.js',
  '/weather-pwa/scripts/luxon-1.11.4.js',
  '/weather-pwa/styles/inline.css',
  '/weather-pwa/images/add.svg',
  '/weather-pwa/images/clear-day.svg',
  '/weather-pwa/images/clear-night.svg',
  '/weather-pwa/images/cloudy.svg',
  '/weather-pwa/images/fog.svg',
  '/weather-pwa/images/hail.svg',
  '/weather-pwa/images/install.svg',
  '/weather-pwa/images/partly-cloudy-day.svg',
  '/weather-pwa/images/partly-cloudy-night.svg',
  '/weather-pwa/images/rain.svg',
  '/weather-pwa/images/refresh.svg',
  '/weather-pwa/images/sleet.svg',
  '/weather-pwa/images/snow.svg',
  '/weather-pwa/images/thunderstorm.svg',
  '/weather-pwa/images/tornado.svg',
  '/weather-pwa/images/wind.svg',
];

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');

  // CODELAB: Precache static resources here.
  evt.waitUntil(
	caches.open(CACHE_NAME)
    .then((cache)=>{
		console.log('[Service Worker] SHEMP: Moe, pre-caching dha FILES_TO_CACHE...');
		return cache.addAll(FILES_TO_CACHE);	
	})
  );

  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');

  // CODELAB: Remove previous cached data from disk.
  //
  // => https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil
  // The extendableEvent.waitUntil() method tells the event dispatcher that work is ongoing.
  // It can also be used to detect whether that work was successful. In service workers,
  // waitUntil() tells the browser that work is ongoing until the promise settles, and
  // it shouldn't terminate the service worker if it wants that work to complete.
  // 
  // => The updated service worker takes control immediately because our install event finishes
  // with self.skipWaiting(), and the activate event finishes with self.clients.claim().
  // Without those, the old service worker would continue to control the page as long as there
  // is a tab open to the page.
  evt.waitUntil(
	 caches.keys()
	 .then((keyList)=>{
		return Promise.all(
            keyList.map((key) => {
				if(key !== CACHE_NAME && key !== DATA_CACHE_NAME ){
					console.log(`[ServiceWorker] SHEMP: Moe, removing old cache wit' key "${key}" cuz it don't equal dha CACHE_NAME = "${CACHE_NAME}" or dha DATA_CACHE_NAME = "${DATA_CACHE_NAME}"...`);
					return caches.delete(key);
				}
            })/* map() */
        )/* Promise.all() */
	 }) /* .then */ 
  ); /* evt.waitUntil */

  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {

  console.log('[ServiceWorker] Fetch', evt.request.url);

// CODELAB: Add fetch event handler here.
// This was for the basic offline experience.
  // => And finally, we need to handle fetch events. We're going to use a
  // [Network falling back to cache]
  // (https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache)
  // strategy.
  // The service worker first tries to fetch the resource from the network.
  // If that fails, the service worker returns the offline page from the cache,
  // avoiding Chrome's "offline" dinosaur...
  //
  // => Wrapping the fetch() call in evt.respondWith() prevents the browsers default fetch
  //    handling and tells the browser we want to handle the response ourselves.
  //    If you don't call evt.respondWith() inside of a `fetch` handler,
  //    you'll just get the default network behavior (Chrome's "offline" dinosaur if you're
  //    offline, I presume)...
  //
  // => The `fetch` handler only needs to handle page navigations,
  //    so other requests can be dumped out of the handler and
  //    dealt with normally by the browser.
  //
  // => Use fetch to try to get the item from the network. If it fails,
  //    the catch handler opens the cache with caches.open(CACHE_NAME) and uses
  //    cache.match('offline.html') to get the precached offline page. The
  //    result is then passed back to the browser using evt.respondWith(). 
//  if(evt.request.mode !== 'navigate'){
//	// Not a page navigation, bail...
//    return;
//  }
//
//  evt.respondWith(  
//	fetch(evt.request)
//    .catch((err)=>{
//		console.log(`SHEMP: Caught an err fetchin' evt.request.url = "${evt.request.url}", Moe...so servin' up dha offline page...`);
//		return caches.open(CACHE_NAME)
//          .then((cache)=>{
//			 return cache.match('/weather-pwa/offline.html')
//	  	  });
//	})/* .catch() */
//  );

// CODELAB: Add fetch event handler here.
// **************************************
//
// This is for the full offline experience.
//
// 'stale-while-revisiting' strategy: network response
// is the "source of truth", but if the network can't
// supply us, it's OK to fail because we've already
// retrieved the latest cached data in our app
//
// Update the `fetch` event handler to handle requests to
// the data API separately from other requests.
if(evt.request.url.includes('/forecast/')){  

   console.log('[Service Worker] Fetch (data)', evt.request.url); 

   evt.respondWith(

       caches.open(DATA_CACHE_NAME)
       .then((cache) => {
           return fetch(evt.request)
               .then((response)=>{
                // If the response was good, clone it and store it in the cache. 
                if(response.status === 200){
                    console.log('[Service Worker] Fetch (data)', evt.request.url, ": SHEMP: Dha response was good, Moe, so storin' a clone of it in dha cache..."); 
                    cache.put(evt.request.url, response.clone());
                }
                return response;
               }) /* then */
               .catch((err) => {
                   // Network request failed, try to get it from the cache.
                   console.log('[Service Worker] Fetch (data)', evt.request.url, ': SHEMP: Sorry, Moe, dha network request failed, tryin\' to get it from dha cache...');
                   return cache.match(evt.request);
               }); /* catch */
       }) /* then */
   ); /* evt.respondWith */

   return;

}/* if(evt.request.url.includes('/forecast/')) */

evt.respondWith(
    caches.open(CACHE_NAME)
    .then((cache)=>{
        return cache.match(evt.request)
        .then((response)=>{
            return response || fetch(evt.request)
        });/* then */
    })/* then */
);

}); /* self.addEventListener('fetch'... */
