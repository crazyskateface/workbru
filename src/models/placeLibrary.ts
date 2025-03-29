import {Place, PlaceSchema} from './place';
const placeLibrary = {
    // list of places
    spaces : [] as Place[],
    //constructor 
    init : function() {
        this.spaces = [];
    },
    // add a place
    addPlace : function(place:Place) {
        this.spaces.push(place);
    },
    // remove a place
    removePlace : function(place:Place) {
        this.spaces = this.spaces.filter(w => w !== place);
    },
    // get all places
    getPlaces : function() {
        return this.spaces;
    },
    // get a place by name
    getPlaceByName : function(name:string) {
        return this.spaces.find(w => w.name === name);
    },
    // get a place by location
    getPlaceByLocation : function(location:{}) {
        return this.spaces.find(w => w.location === location);
    },
    // get a place by key
    // getPlaceByKey : function(key:string) {
    //     return this.spaces.find(w => w.poi.key === key);
    // },
    // get places by filter
    getPlacesByFilter : function(filter:Function) {
        return this.spaces.filter((space) => filter(space));
    },
    // load places from json
    setPlaces : function(data:any[]) {
        data.forEach((item:any) => {
            PlaceSchema.parse(item)
            this.addPlace(item);
        })
    }
}

export default placeLibrary;