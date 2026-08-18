/* Emergency data source: Hospitals.kml. It contains 646 records with names and coordinates, plus available facility details. */
const HOSPITALS=[{"name":"Shree Saptashrungi Nursing Home","lat":19.9519991,"lng":73.8252573,"category":"doctor","address":"Plot No 3, Rachana Colony, 1, Jai Bhavani Rd, Adke Nagar, Nashik Road, Nashik, Maharashtra 422102, India","rating":"4.5","place_id":"ChIJoXJ8pE6V3TsRP-r2EmHDaQE","distance_m":"2308"},{"name":"Dr.Trupti Kulthe (Udawant) BAMS | General Physician | Women Health | Thyroid | Diabetologist in Nashik | Vishwavinayak Clinic","lat":19.9515766,"lng":73.8252047,"category":"doctor","address":"The Cennet Appartment, Jai Bhavani Rd, Jackak Nagar, Gandhi Nagar Airport Area, Deolali Gaon, Nashik, Maharashtra 422102, India","rating":"4.5","place_id":"ChIJpWQOlvmV3TsRMAqmc8xO3bo","distance_m":"2262"},{"name":"Sudharm Medical and General Store","lat":19.957952,"lng":73.82381,"category":"general_hospital","address":"Suman hospital, Suman Hospital Compound, Jai Bhavani Rd, Gandhi Nagar Airport Area, Nashik Road, Nashik, Maharashtra 422102, India","rating":"3.8","place_id":"ChIJoWW5U0uV3TsR9GVEgCceTX4","distance_m":"2985"},{"name":"Anandghar Foundation | Rehabilitation Centre","lat":19.9580783,"lng":73.8239838,"category":"health","address":"Plot No:03 Jai Bhavani Road, Road, opposite Suman Hospital, Pradhan Nagar, Deolali Gaon, Nashik, Maharashtra 422101, India","rating":"4.6","place_id":"ChIJx0ifVEuV3TsRVFa331DFs78","distance_m":"2996"},{"name":"Samarth Nursing Home","lat":19.957857,"lng":73.8382939,"category":"health","address":"6,1st Floor, Jail Rd, near Wasan Bajaj Showroom, DattaMandir, Nashik Road, Nashik, Maharashtra 422101, India","rating":"5","place_id":"ChIJ0Wwz5lSV3TsRV9Gu2ZyMWRg","distance_m":"2314"},{"name":"Parasnath Speciality Clinics | Knee and Spine Clinic in Nashik Road","lat":19.959079,"lng":73.8390714,"category":"health","address":"2nd Floor, Anand Mall, Jail Rd, next to kothari kanya school, Kala Nagar, Government Colony, Nashik, Maharashtra 422101, India","rating":"5","place_id":"ChIJ8-W1y_2V3TsR2Lh0ds_Zxho","distance_m":"2277"},{"name":"MEDICARE MULTISPECIALITY HOSPITAL - Dr. Ravindranath Gaikwad","lat":19.95271,"lng":73.8357602,"category":"hospital","address":"Medicare multispeciality Hospital 1st floor ,Gaikwad sankul, Bytco Point, above Jalgaon peoples bank, behind Regimental Plaza, Gayakhe Colony, Nashik Road, Nashik, Maharashtra 422101, India","rating":"5","place_id":"ChIJuwToGVaV3TsRaO9mPKRZx8A","distance_m":"2505"}];

const PARKING_MAP_ID = '16_V-Q2cAJxNiID1Ez_9m6So3dGaIi2g';
const PARKING_KML_URL = `https://www.google.com/maps/d/kml?mid=${PARKING_MAP_ID}&forcekml=1`;

const FOOD = [
  {name:'Cereals',icon:'🌾',grams:312},
  {name:'cooking Oil',icon:'🛢️',grams:26},
  {name:'Fruits',icon:'🍎',grams:32},
  {name:'Hotels',icon:'🏨',constant:100},
  {name:'LPG',icon:'🛢️',grams:65},
  {name:'Milk',icon:'🥛',grams:194},
  {name:'Pulses',icon:'🫘',grams:30},
  {name:'Rice',icon:'🍚',grams:155},
  {name:'Sugar',icon:'🍬',grams:29},
  {name:'Vegetables',icon:'🥬',grams:171},
  {name:'Wheat',icon:'🌾',grams:145}
];
const TOTAL_FOOD_GRAMS = 1094;

const FREIGHT_DATA = [
  {id:'industries',icon:'🏗️',name:'Industries',establishments:0,avgTrips:0,totalTrips:0,avgFreight:0,totalFreight:0,peak:'—'},
  {id:'restaurants',icon:'🍽️',name:'Restaurants & Cafes',establishments:523,avgTrips:4.2,totalTrips:1890,avgFreight:1.2,totalFreight:540,peak:'5-9'},
  {id:'retail',icon:'🛍️',name:'Shopping & Retails',establishments:680,avgTrips:2.1,totalTrips:1428,avgFreight:0.8,totalFreight:544,peak:'8-12'},
  {id:'warehouses',icon:'🏭',name:'Warehouses',establishments:437,avgTrips:3.6,totalTrips:1186,avgFreight:2.3,totalFreight:603,peak:'9-12'}
]

const FREIGHT_DAY_TYPES = [
  {
    id:'normal-kumbh',
    icon:'🕉️',
    name:'Normal Kumbh Days',
    description:'Freight demand during regular Kumbh Mela days.'
  },
  {
    id:'shahi-snan',
    icon:'🛕',
    name:'Shahi Snan Days',
    description:'Freight demand during Shahi Snan days.'
  }
];

/* Warehouse locations loaded from Warehouses.kml */
const WAREHOUSE_LOCATIONS = [{"name": "Dhongade point", "lat": 19.953314, "lng": 73.8309435, "description": ""}, {"name": "shree vijay traders", "lat": 19.951409, "lng": 73.829483, "description": ""}, {"name": "Nashik Home Appliances", "lat": 19.9581976, "lng": 73.8349277, "description": ""}, {"name": "Cidco colony", "lat": 19.9681433, "lng": 73.7598415, "description": ""}, {"name": "Blue Dart Express Limited", "lat": 19.9646689, "lng": 73.7654827, "description": ""}, {"name": "Shivam's official address", "lat": 19.971464, "lng": 73.755892, "description": ""}, {"name": "DP World Nashik", "lat": 20.0001607, "lng": 73.7242301, "description": ""}, {"name": "DHL Express (India) Pvt. Ltd", "lat": 20.0047907, "lng": 73.7680685, "description": ""}];

/* Restaurants & Cafes data loaded from Restaurents-and_cafes(3).kml */
const RESTAURANTS_CAFES = [{"name":"Shanghai chinese","lat":19.9678713,"lng":73.8193393,"description":""},{"name":"Hotel Rohini | Non Veg Special","lat":19.9563605,"lng":73.8339178,"description":""},{"name":"Sai Jagat Pure VEG Family Restaurant Best Food in Nashik road","lat":19.9530478,"lng":73.8372277,"description":""},{"name":"Vegetable market nashik road","lat":19.9528549,"lng":73.8389672,"description":""},{"name":"Haldiram's","lat":19.9914239,"lng":73.7831716,"description":""},{"name":"Shree Khodiyar Kathiyawadi Dhaba","lat":20.002545,"lng":73.7623827,"description":""}];

const state={restaurantMap:null,restaurantMarkers:[],
  population:2500000,
  foodVehicleCapacity:4,
  waterTankerCapacity:5000,
  hospitals:[],
  map:null,
  markers:[],
  parkingLocations:[],
  parkingMap:null,
  parkingMarkers:[]
};

const view=document.querySelector('#view');
const nf=new Intl.NumberFormat('en-IN',{maximumFractionDigits:1});
const num=n=>nf.format(n);
function back(){return '<button class="back" data-home>← Back to Dashboard</button>'}
function escapeHTML(s){const x=document.createElement('span');x.textContent=s;return x.innerHTML}

/* ---------- Home ---------- */
function renderHome(selectedDayType=null){
  window.selectedKumbhDayType=selectedDayType;
  const selectedDay=selectedDayType
    ? FREIGHT_DAY_TYPES.find(d=>d.id===selectedDayType)
    : null;

  if(selectedDay){
    view.innerHTML=`
      <section class="page">
        <section class="dates-ticker" aria-label="Important Dates">
          <span class="dates-ticker-label">📅 IMPORTANT DATES</span>
          <div class="dates-ticker-viewport">
            <div class="dates-ticker-track">
              <span class="dates-ticker-item"><strong>31 Oct 2026</strong> Flag Hoisting</span>
              <span class="dates-ticker-item"><strong>2 Aug 2027</strong> Amrit Snan – First</span>
              <span class="dates-ticker-item"><strong>31 Aug 2027</strong> Amrit Snan – Second</span>
              <span class="dates-ticker-item"><strong>11 Sep 2027</strong> Amrit Snan – Third</span>
              <span class="dates-ticker-item"><strong>31 Oct 2026</strong> Flag Hoisting</span>
              <span class="dates-ticker-item"><strong>2 Aug 2027</strong> Amrit Snan – First</span>
              <span class="dates-ticker-item"><strong>31 Aug 2027</strong> Amrit Snan – Second</span>
              <span class="dates-ticker-item"><strong>11 Sep 2027</strong> Amrit Snan – Third</span>
            </div>
          </div>
        </section>

        <div class="landing-intro">
          <div class="eyebrow">Simhastha Kumbh Mela 2027</div>
          <h1>${selectedDay.icon} ${selectedDay.name}</h1>
          <p>Select a planning module to continue.</p>
        </div>

        <div class="selected-day-bar">
          <span>${selectedDay.icon} ${selectedDay.name}</span>
          <button class="day-switch" data-switch-day>Change Day Type</button>
        </div>

        <div class="module-grid">
          ${[
            {id:'transport',icon:'🚛',title:'Freight Demand',short:'FD',desc:'Freight and commodity movement'},
            {id:'amenities',icon:'💧',title:'Basic Amenities',short:'BA',desc:'Food, water & essential resources'},
            {id:'parking',icon:'🅿️',title:'Parking',short:'P',desc:'Capacity & vehicle management'},
            {id:'emergency',icon:'🚑',title:'Emergency',short:'E',desc:'Hospital location readiness'}
          ].map(m=>`
            <button class="module-card" data-module="${m.id}">
              <span class="module-icon">${m.icon}</span>
              <h2>${m.title}</h2>
              <p>${m.desc}</p>
              <span class="module-arrow">→</span>
            </button>
          `).join('')}
        </div>
      </section>`;

    bindNav();
    document.querySelector('[data-switch-day]').addEventListener('click',()=>renderHome(null));
    return;
  }

  view.innerHTML=`
    <section class="page home-page">
      <section class="dates-ticker" aria-label="Important Dates">
        <span class="dates-ticker-label">📅 IMPORTANT DATES</span>
        <div class="dates-ticker-viewport">
          <div class="dates-ticker-track">
            <span class="dates-ticker-item"><strong>31 Oct 2026</strong> Flag Hoisting</span>
            <span class="dates-ticker-item"><strong>2 Aug 2027</strong> Amrit Snan – First</span>
            <span class="dates-ticker-item"><strong>31 Aug 2027</strong> Amrit Snan – Second</span>
            <span class="dates-ticker-item"><strong>11 Sep 2027</strong> Amrit Snan – Third</span>
            <span class="dates-ticker-item"><strong>31 Oct 2026</strong> Flag Hoisting</span>
            <span class="dates-ticker-item"><strong>2 Aug 2027</strong> Amrit Snan – First</span>
            <span class="dates-ticker-item"><strong>31 Aug 2027</strong> Amrit Snan – Second</span>
            <span class="dates-ticker-item"><strong>11 Sep 2027</strong> Amrit Snan – Third</span>
          </div>
        </div>
      </section>

      <div class="landing-intro">
        <div class="eyebrow">Simhastha Kumbh Mela 2027</div>
        <h1>Select Kumbh Day Type</h1>
        <p></p>
      </div>

      <div class="day-type-grid">
        ${FREIGHT_DAY_TYPES.map(d=>`
          <button class="day-type-card" data-day-type-home="${d.id}">
            <span class="day-type-icon">${d.icon}</span>
            <h2>${d.name}</h2>
            <p>${d.description}</p>
            <span class="day-type-arrow">→</span>
          </button>
        `).join('')}
      </div>
    </section>`;

  document.querySelectorAll('[data-day-type-home]').forEach(btn=>{
    btn.addEventListener('click',()=>renderHome(btn.dataset.dayTypeHome));
  });
}

/* ---------- Basic Amenities ---------- */
function amenityHTML(){
  const p=state.population,water=p*135,waste=p*.5,total=p*TOTAL_FOOD_GRAMS/1e6;
  const vehicleCapacity=Number(state.foodVehicleCapacity),tankerCapacity=Number(state.waterTankerCapacity);
  const validVehicle=Number.isFinite(vehicleCapacity)&&vehicleCapacity>0,validTanker=Number.isFinite(tankerCapacity)&&tankerCapacity>0;
  const foodTrips=validVehicle?Math.ceil(total/vehicleCapacity):null,tankerTrips=validTanker?Math.ceil(water/tankerCapacity):null;
  return `<section class="page module-page"><div class="page-top"><div><div class="eyebrow">Resource planning</div><h1>Basic Amenities</h1><p>Population-led estimates update instantly across every requirement.</p></div>${back()}</div><div class="metric-grid"><article class="metric population-card"><div class="label">👥 Total population</div><input id="population" class="population-input" type="number" min="0" step="1000" value="${p}" aria-label="Total population"><small>Enter projected pilgrims and residents</small></article><article class="metric"><div class="label">💧 Water requirement</div><div class="number">${num(water/1e6)} MLD</div><small>${num(water)} litres/day · 135 LPCD</small></article><article class="metric"><div class="label">♻ Solid waste</div><div class="number">${num(waste/1000)} t/day</div><small>${num(waste)} kg/day · 0.5 kg/person/day</small></article><article class="metric"><div class="label">🍚 Total food</div><div class="number">${num(total)} t/day</div><small>${num(p*TOTAL_FOOD_GRAMS/1000)} kg/day · ${TOTAL_FOOD_GRAMS.toLocaleString('en-IN')} g/person/day</small></article></div><div class="info-band"><div><span>🍚 TOTAL FOOD REQUIREMENT</span><strong>${num(total)} tonnes/day</strong></div><span>Calculated at ${TOTAL_FOOD_GRAMS.toLocaleString('en-IN')} g/person/day</span></div><h2 class="panel-title">Daily Food Requirements</h2><div class="food-grid">${FOOD.map(f=>{
  if(f.name==='Hotels'){
    return `<article class="food-card">
      <div class="label">${f.icon}</div>
      <h3>${f.name}</h3>
      <div class="tonnes">${num(f.constant)}</div>
      <small>No. of hotels</small>
    </article>`;
  }
  const fTonnes=p*f.grams/1e6;
  const fTrips=validVehicle?Math.ceil(fTonnes/vehicleCapacity):null;
  return `<article class="food-card">
    <div class="label">${f.icon} ${f.grams} g/person/day</div>
    <h3>${f.name}</h3>
    <div class="tonnes">${num(fTonnes)} tonnes/day</div>
    <small>${num(p*f.grams/1000)} kg/day</small>
    <div class="trips">${fTrips===null?'—':num(fTrips)+' trips/day'}</div>
  </article>`;
}).join('')}</div></div><h2 class="panel-title">Food Transportation Requirement</h2><div class="transport-grid"><article class="metric transport-input"><div class="label">🚛 Vehicle carrying capacity</div><input id="food-vehicle-capacity" class="transport-capacity" type="number" min="0.01" step="0.1" value="${state.foodVehicleCapacity}" aria-label="Vehicle carrying capacity"><small>tonnes/vehicle</small>${validVehicle?'':'<p class="validation-message">Enter a capacity greater than 0.</p>'}</article><article class="metric"><div class="label">🚛 Required food vehicle trips</div><div class="number">${foodTrips===null?'—':num(foodTrips)}</div><small>${foodTrips===null?'Calculation unavailable':'trips/day · rounded up'}</small></article></div><h2 class="panel-title">Water Transportation Requirement</h2><div class="transport-grid"><article class="metric transport-input"><div class="label">💧 Water tanker capacity</div><input id="water-tanker-capacity" class="transport-capacity" type="number" min="1" step="100" value="${state.waterTankerCapacity}" aria-label="Water tanker capacity"><small>litres/tanker</small>${validTanker?'':'<p class="validation-message">Enter a capacity greater than 0.</p>'}</article><article class="metric"><div class="label">💧 Required water tankers</div><div class="number">${tankerTrips===null?'—':num(tankerTrips)}</div><small>${tankerTrips===null?'Calculation unavailable':'tankers/day · rounded up'}</small></article></div></section>`;
}
function renderAmenities(){
  view.innerHTML=amenityHTML();
  bindNav();
  document.querySelector('#population').addEventListener('input',e=>{state.population=Math.max(0,Number(e.target.value)||0);renderAmenities()});
  document.querySelector('#food-vehicle-capacity').addEventListener('input',e=>{state.foodVehicleCapacity=Number(e.target.value);renderAmenities()});
  document.querySelector('#water-tanker-capacity').addEventListener('input',e=>{state.waterTankerCapacity=Number(e.target.value);renderAmenities()});
}

function warehouseLocationHTML(){
  return `
    <div class="warehouse-location-panel">
      <div class="warehouse-location-head">
        <div>
          <h4>📍 Warehouse Locations</h4>
          <small>${WAREHOUSE_LOCATIONS.length.toLocaleString('en-IN')} locations from Warehouses.kml</small>
        </div>
      </div>
      <div class="warehouse-layout">
        <div class="warehouse-list">
          <input id="warehouse-search" class="warehouse-search" placeholder="Search warehouse…" aria-label="Search warehouse">
          <div id="warehouse-results">
            ${WAREHOUSE_LOCATIONS.map((w,i)=>`
              <button class="warehouse-item" data-warehouse="${i}">
                ${i+1}. ${escapeHTML(w.name)}
                <small>Latitude: ${w.lat} · Longitude: ${w.lng}</small>
              </button>
            `).join('')}
          </div>
        </div>
        <div id="warehouse-map"></div>
      </div>
    </div>`;
}

function initWarehouseMap(){
  const mapElement=document.querySelector('#warehouse-map');
  if(!mapElement || !WAREHOUSE_LOCATIONS.length || typeof L==='undefined')return;

  const map=L.map('warehouse-map').setView([20.0,73.78],11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap contributors'
  }).addTo(map);

  const markers=WAREHOUSE_LOCATIONS.map((w,i)=>{
    const marker=L.marker([w.lat,w.lng]).addTo(map)
      .bindPopup(`<strong>${escapeHTML(w.name)}</strong><br>Latitude: ${w.lat}<br>Longitude: ${w.lng}${w.description?'<br>'+escapeHTML(w.description):''}`);
    marker.on('click',()=>{
      document.querySelectorAll('.warehouse-item').forEach(b=>b.classList.toggle('active',Number(b.dataset.warehouse)===i));
    });
    return marker;
  });

  if(markers.length){
    map.fitBounds(L.featureGroup(markers).getBounds().pad(.12));
  }

  document.querySelectorAll('.warehouse-item').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const i=Number(btn.dataset.warehouse);
      const w=WAREHOUSE_LOCATIONS[i];
      document.querySelectorAll('.warehouse-item').forEach(b=>b.classList.toggle('active',b===btn));
      map.setView([w.lat,w.lng],15);
      markers[i].openPopup();
    });
  });

  const search=document.querySelector('#warehouse-search');
  if(search){
    search.addEventListener('input',e=>{
      const q=e.target.value.toLowerCase();
      document.querySelectorAll('.warehouse-item').forEach(btn=>{
        btn.hidden=!btn.textContent.toLowerCase().includes(q);
      });
    });
  }
}

/* ---------- Freight Demand (selected day type) ---------- */
function freightCategoryHTML(dayType){
  const dayName=FREIGHT_DAY_TYPES.find(d=>d.id===dayType)?.name||'';

  return `
    <div class="freight-selected-heading">
      <div>
        <div class="eyebrow">${dayName}</div>
        <h3>Select Establishment Category</h3>
      </div>
      <button class="freight-back" data-day-back>← Back to Dashboard</button>
    </div>

    <div class="freight-grid">
      ${FREIGHT_DATA.map(f=>`
        <button class="freight-card" data-freight="${f.id}">
          <span class="freight-icon">${f.icon}</span>
          <h3>${f.name}</h3>
          <small>Tap to view freight demand</small>
        </button>
      `).join('')}
    </div>
  `;
}

function freightDetailHTML(f,dayType){

  const restaurantLocationSection = f.id==='restaurants' ? `
    <div class="restaurant-location-panel">
      <div class="restaurant-location-header">
        <h2>📍 Restaurants & Cafes Locations</h2>
        <small>${RESTAURANTS_CAFES.length} locations from Restaurents-and_cafes(3).kml</small>
      </div>

      <div class="restaurant-location-body">
        <div class="restaurant-location-list">
          <input class="hospital-search" id="restaurant-search"
                 placeholder="Search restaurant or cafe..."
                 aria-label="Search restaurant or cafe">

          <div id="restaurant-results">
            ${RESTAURANTS_CAFES.map((r,i)=>`
              <button class="hospital-item restaurant-item" data-restaurant="${i}">
                ${i+1}. ${escapeHTML(r.name)}
                <small>${r.description ? escapeHTML(r.description)+' · ' : ''}Latitude: ${r.lat} · Longitude: ${r.lng}</small>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="restaurant-location-map">
          <div id="restaurant-map" style="height:520px;width:100%;"></div>
        </div>
      </div>
    </div>` : '';

  const dayName=FREIGHT_DAY_TYPES.find(d=>d.id===dayType)?.name||'';

  return `
    <div class="freight-detail">
      <div class="freight-detail-top">
        <div>
          <div class="eyebrow">${dayName} · Freight demand</div>
          <h3>${f.icon} ${f.name}</h3>
        </div>
        <button class="freight-back" data-freight-back>← Back to Categories</button>
      </div>

      <div class="freight-metric-grid">
        <div class="freight-metric"><div class="num">${f.establishments}</div><div class="lbl">No. of Establishments</div></div>
        <div class="freight-metric"><div class="num">${f.avgTrips}</div><div class="lbl">Avg. Trips/Day/Est.</div></div>
        <div class="freight-metric"><div class="num">${f.totalTrips.toLocaleString('en-IN')}</div><div class="lbl">Total Trips/Day</div></div>
        <div class="freight-metric"><div class="num">${f.avgFreight} t</div><div class="lbl">Avg. Freight/Day</div></div>
        <div class="freight-metric"><div class="num">${f.totalFreight} t</div><div class="lbl">Total Freight/Day</div></div>
        <div class="freight-metric"><div class="num">${f.peak}</div><div class="lbl">Peak Demand Period</div></div>
      </div>
    ${f.id==='restaurants'?restaurantLocationSection:''}
    ${f.id==='warehouses'?warehouseLocationHTML():''}
    </div>
  `;
}


function selectRestaurant(index){
  document.querySelectorAll('.restaurant-item').forEach(b=>{
    b.classList.toggle('active',Number(b.dataset.restaurant)===index);
  });
  const r=RESTAURANTS_CAFES[index];
  const marker=state.restaurantMarkers?.[index];
  if(marker && state.restaurantMap){
    state.restaurantMap.setView([r.lat,r.lng],15);
    marker.openPopup();
  }
}

function renderFreightSection(dayType,selectedId=null){
  const container=document.querySelector('#freight-container');
  if(!container)return;

  // Day type was selected on the front page.
  // Show the four freight categories directly.
  if(!selectedId){
    container.innerHTML=freightCategoryHTML(dayType);

    container.querySelector('[data-day-back]')
      .addEventListener('click',()=>renderHome(null));

    container.querySelectorAll('[data-freight]').forEach(btn=>{
      btn.addEventListener('click',()=>renderFreightSection(dayType,btn.dataset.freight));
    });

    return;
  }

  // Selected freight category.
  const f=FREIGHT_DATA.find(x=>x.id===selectedId);
  if(!f)return;

  container.innerHTML=freightDetailHTML(f,dayType);

    if(f.id==='restaurants'){
      setTimeout(()=>{
        const mapElement=document.querySelector('#restaurant-map');
        if(!mapElement || !RESTAURANTS_CAFES.length)return;

        state.restaurantMap=L.map('restaurant-map')
          .setView([RESTAURANTS_CAFES[0].lat,RESTAURANTS_CAFES[0].lng],11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
          attribution:'© OpenStreetMap contributors'
        }).addTo(state.restaurantMap);

        state.restaurantMarkers=RESTAURANTS_CAFES.map((r,i)=>{
          const marker=L.marker([r.lat,r.lng])
            .addTo(state.restaurantMap)
            .bindPopup(
              `<strong>${escapeHTML(r.name)}</strong>` +
              `${r.description ? '<br>'+escapeHTML(r.description) : ''}` +
              `<br>Latitude: ${r.lat}<br>Longitude: ${r.lng}`
            );
          marker.on('click',()=>selectRestaurant(i));
          return marker;
        });

        state.restaurantMap.fitBounds(
          L.featureGroup(state.restaurantMarkers).getBounds().pad(.12)
        );

        document.querySelector('#restaurant-search')?.addEventListener('input',e=>{
          const q=e.target.value.toLowerCase();
          document.querySelectorAll('.restaurant-item').forEach(b=>{
            b.hidden=!b.textContent.toLowerCase().includes(q);
          });
        });

        document.querySelectorAll('.restaurant-item').forEach(b=>{
          b.addEventListener('click',()=>selectRestaurant(Number(b.dataset.restaurant)));
        });
      },0);
    }


  if(f.id==='warehouses'){
    setTimeout(initWarehouseMap,0);
  }

  container.querySelector('[data-freight-back]')
    .addEventListener('click',()=>renderFreightSection(dayType,null));
}

function renderTransport(dayType=null){
  // If Freight Demand is opened directly for any reason, use the
  // currently selected day type from the front page when available.
  if(!dayType){
    dayType=window.selectedKumbhDayType||FREIGHT_DAY_TYPES[0].id;
  }

  window.selectedKumbhDayType=dayType;

  view.innerHTML=`<section class="page module-page">
    <div class="page-top">
      <div>
        <div class="eyebrow">${FREIGHT_DAY_TYPES.find(d=>d.id===dayType)?.name||''}</div>
        <h1>Freight Demand</h1>
        <p>Select an establishment category to view its freight-demand details.</p>
      </div>
      ${back()}
    </div>

    <section class="freight-section">
      <div id="freight-container"></div>
    </section>
  </section>`;

  bindNav();
  renderFreightSection(dayType);
}

/* ---------- Emergency (Hospitals) ---------- */
async function loadHospitals(){state.hospitals=HOSPITALS;return state.hospitals}
function hospitalRows(records){
  return records.map((h,i)=>`<button class="hospital-item" data-hospital="${i}">
    ${i+1}. ${escapeHTML(h.name)}
    <small>${escapeHTML(h.category||'Health facility')} · ${escapeHTML(h.address||'Address not supplied')}</small>
  </button>`).join('')
}
function drawMap(records){
  state.map=L.map('hospital-map').setView([19.9975,73.7898],11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(state.map);
  state.markers=records.map((h,i)=>{
    const details=[
      h.category?`Category: ${escapeHTML(h.category)}`:'',
      h.address?`Address: ${escapeHTML(h.address)}`:'',
      h.rating?`Rating: ${escapeHTML(h.rating)}`:'',
      `Latitude: ${h.lat}`,
      `Longitude: ${h.lng}`
    ].filter(Boolean).join('<br>');
    const m=L.marker([h.lat,h.lng]).addTo(state.map)
      .bindPopup(`<strong>${escapeHTML(h.name)}</strong><br>${details}`);
    m.on('click',()=>selectHospital(i));
    return m;
  });
  state.map.fitBounds(L.featureGroup(state.markers).getBounds().pad(.12));
}
function selectHospital(index){
  document.querySelectorAll('.hospital-item').forEach(b=>b.classList.toggle('active',Number(b.dataset.hospital)===index));
  const h=state.hospitals[index],marker=state.markers[index];
  if(marker&&state.map){state.map.setView([h.lat,h.lng],15);marker.openPopup()}
}
async function renderEmergency(){
  view.innerHTML=`<section class="page module-page"><div class="page-top"><div><div class="eyebrow">Health &amp; response readiness</div><h1>Emergency Management</h1><p>Hospital and health-facility locations are loaded from Hospitals.kml.</p></div>${back()}</div><div class="emergency-layout"><aside><article class="metric"><div class="label">🏥 Total records</div><div class="number">${HOSPITALS.length}</div><small>Hospitals.kml records</small></article><div class="hospital-list"><h2>Hospital List</h2><input class="hospital-search" placeholder="Search hospital…" aria-label="Search hospital"><div id="hospital-results"><p class="source-note">Loading hospital records…</p></div></div></aside><section class="map-panel"><div class="map-heading"><h2>📍 Hospital Location Map – Nashik</h2><small>All ${HOSPITALS.length} markers use coordinates from Hospitals.kml.</small></div><div id="hospital-map" class="map-empty"><div>Loading hospital locations…</div></div></section></div><p class="source-note">Source: Hospitals.kml — ${HOSPITALS.length} records with names, coordinates, categories and available details.</p></section>`;
  bindNav();
  const records=await loadHospitals();
  if(!document.querySelector('#hospital-results'))return;
  document.querySelector('#hospital-results').innerHTML=hospitalRows(records);
  drawMap(records);
  document.querySelector('.hospital-search').addEventListener('input',e=>{
    const q=e.target.value.toLowerCase();
    document.querySelectorAll('.hospital-item').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(q));
  });
  document.querySelectorAll('.hospital-item').forEach(b=>b.addEventListener('click',()=>selectHospital(Number(b.dataset.hospital))));
}

/* ---------- Parking ---------- */
function parseParkingKml(text){
  const xml=new DOMParser().parseFromString(text,'application/xml');
  return [...xml.querySelectorAll('Placemark')].map((p,i)=>{
    const name=p.querySelector('name')?.textContent.trim()||`Unnamed parking location ${i+1}`;
    const description=(p.querySelector('description')?.textContent||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    const raw=p.querySelector('Point coordinates')?.textContent.trim();
    if(!raw)return {name,description,lat:null,lng:null};
    const [lng,lat]=raw.split(',').map(Number);
    return Number.isFinite(lat)&&Number.isFinite(lng)?{name,description,lat,lng}:{name,description,lat:null,lng:null};
  });
}
async function loadParkingLocations(){
  if(state.parkingLocations.length)return state.parkingLocations;
  try{
    const response=await fetch(PARKING_KML_URL);
    if(!response.ok)throw new Error('Parking KML unavailable');
    state.parkingLocations=parseParkingKml(await response.text());
    return state.parkingLocations;
  }catch(error){
    console.warn('Parking data could not be loaded from the supplied Google My Maps source.',error);
    return [];
  }
}
function parkingRows(records){
  return records.map((location,index)=>`<button class="parking-item" data-parking="${index}">${index+1}. ${escapeHTML(location.name)}<small>${location.lat===null?'Location not supplied in source':location.description||'Map location available'}</small></button>`).join('')||'<p class="source-note">No parking records could be loaded. No locations have been substituted.</p>';
}
function drawParkingMap(records){
  const located=records.filter(location=>location.lat!==null);
  const mapElement=document.querySelector('#parking-map');
  if(!located.length){
    mapElement.outerHTML='<div id="parking-map" class="map-empty"><div><div class="empty-icon">🅿️</div><strong>No usable parking coordinates were returned</strong><p>The dashboard has not substituted any parking data.</p></div></div>';
    return;
  }
  state.parkingMap=L.map('parking-map').setView([19.9275,73.7503],10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(state.parkingMap);
  state.parkingMarkers=records.map((location,index)=>{
    if(location.lat===null)return null;
    const marker=L.marker([location.lat,location.lng]).addTo(state.parkingMap).bindPopup(`<strong>${escapeHTML(location.name)}</strong>${location.description?'<br>'+escapeHTML(location.description):''}`);
    marker.on('click',()=>selectParkingLocation(index));
    return marker;
  });
  state.parkingMap.fitBounds(L.featureGroup(state.parkingMarkers.filter(Boolean)).getBounds().pad(.12));
}
function selectParkingLocation(index){
  document.querySelectorAll('.parking-item').forEach(button=>button.classList.toggle('active',Number(button.dataset.parking)===index));
  const location=state.parkingLocations[index],marker=state.parkingMarkers[index];
  if(marker&&state.parkingMap){state.parkingMap.setView([location.lat,location.lng],15);marker.openPopup()}
}
async function renderParking(){
  view.innerHTML=`<section class="page module-page"><div class="page-top"><div><div class="eyebrow">Arrival &amp; vehicle management</div><h1>Parking Locations</h1><p>Parking locations are restricted to the authorized Nashik Google My Maps dataset.</p></div>${back()}</div><div class="emergency-layout"><aside><div class="hospital-list"><h2>Parking Location List</h2><input class="hospital-search" id="parking-search" placeholder="Search parking location…" aria-label="Search parking location"><div id="parking-results"><p class="source-note">Loading authorized map records…</p></div></div></aside><section class="map-panel"><div class="map-heading"><h2>📍 Parking Location Map – Nashik</h2><small>Markers are displayed only when coordinates arrive from the supplied map.</small></div><div id="parking-map" class="map-empty"><div>Loading parking locations…</div></div></section></div><p class="source-note">Data source: supplied <a href="https://www.google.com/maps/d/viewer?mid=${PARKING_MAP_ID}" target="_blank" rel="noopener">Google My Maps parking map</a>. No locations or coordinates are sourced elsewhere.</p></section>`;
  bindNav();
  const records=await loadParkingLocations();
  if(!document.querySelector('#parking-results'))return;
  document.querySelector('#parking-results').innerHTML=parkingRows(records);
  drawParkingMap(records);
  document.querySelector('#parking-search').addEventListener('input',event=>{
    const query=event.target.value.toLowerCase();
    document.querySelectorAll('.parking-item').forEach(button=>button.hidden=!button.textContent.toLowerCase().includes(query));
  });
  document.querySelectorAll('.parking-item').forEach(button=>button.addEventListener('click',()=>selectParkingLocation(Number(button.dataset.parking))));
}

/* ---------- Placeholder (unused now that Transportation Demand has content, kept for future modules) ---------- */
function renderPlaceholder(title,icon,tags){
  view.innerHTML=`<section class="page module-page"><div class="page-top"><div><div class="eyebrow">Planning workspace</div><h1>${title}</h1><p>A dedicated analysis area prepared for the next planning phase.</p></div>${back()}</div><div class="placeholder"><div><div class="icon">${icon}</div><h2>${title} module coming into service</h2><p>This focused workspace is ready for data-backed analysis without adding detail to the main dashboard.</p><div class="placeholder-tags">${tags.map(t=>`<span>${t}</span>`).join('')}</div></div></div></section>`;
  bindNav();
}

/* ---------- Navigation ---------- */
function bindNav(){
  document.querySelectorAll('[data-home]').forEach(b=>b.onclick=renderHome);
  document.querySelectorAll('[data-module]').forEach(b=>b.onclick=()=>{
    const module=b.dataset.module;
    if(module==='transport'){
      renderTransport(window.selectedKumbhDayType||FREIGHT_DAY_TYPES[0].id);
      return;
    }
    ({
      amenities:renderAmenities,
      emergency:renderEmergency,
      parking:renderParking
    })[module]();
  });
}
function startBottomSlider(){
  const slides = document.querySelectorAll('.bslide');
  if(!slides.length) return;
  let current = 0;
  setInterval(()=>{
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 4000);
}
startBottomSlider();
renderHome();
