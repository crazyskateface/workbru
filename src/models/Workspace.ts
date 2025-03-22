class Workspace {
    name: string;
    address: string;
    location: google.maps.LatLngLiteral
    freeWifi: boolean;
    coffee: boolean;
    food: boolean;
    outlets: boolean;
    openLate: boolean;
    noiseLevel: string;
    poi: Poi;

    constructor(    name:string, 
                    address:string, 
                    location:{lat:number, lng:number},
                    freeWifi:boolean,
                    coffee:boolean,
                    food:boolean,
                    outlets:boolean,
                    openLate:boolean,
                    noiseLevel:string
                ){
        this.name = name;
        this.address = address;
        this.location = location as google.maps.LatLngLiteral;
        this.freeWifi = freeWifi;
        this.coffee = coffee;
        this.food = food;
        this.outlets = outlets;
        this.openLate = openLate;
        this.noiseLevel = noiseLevel;
        this.poi = {key: name, location: location};

    }

    // getters and setters
    getName():string {
        return this.name;
    }
    setName(name:string):void {
        this.name = name;
    }
    getAddress():string {
        return this.address;
    }
    setAddress(address:string):void {
        this.address = address;
    }
    getLocation():google.maps.LatLngLiteral {
        return this.location;
    }
    setLocation(location:google.maps.LatLngLiteral):void {
        this.location = location;
    }
    getFreeWifi():boolean {
        return this.freeWifi;
    }
    setFreeWifi(freeWifi:boolean):void {
        this.freeWifi = freeWifi;
    }
    getCoffee():boolean {
        return this.coffee;
    }
    setCoffee(coffee:boolean):void {
        this.coffee = coffee;
    }
    getFood():boolean {
        return this.food;
    }
    setFood(food:boolean):void {
        this.food = food;
    }
    getOutlets():boolean {
        return this.outlets;
    }
    setOutlets(outlets:boolean):void {
        this.outlets = outlets;
    }
    getOpenLate():boolean {
        return this.openLate;
    }
    setOpenLate(openLate:boolean):void {
        this.openLate = openLate;
    }
    getNoiseLevel():string {
        return this.noiseLevel;
    }
    setNoiseLevel(noiseLevel:string):void {
        this.noiseLevel = noiseLevel;
    }

    // toString
    toString():string {
        return `${this.name} is located at ${this.address} and has free wifi: ${this.freeWifi}. It is ${this.noiseLevel} and has outlets: ${this.outlets}. It is ${this.openLate ? 'open late' : 'not open late'}.`
    }

    static fromJson = (json:any) => {
        // create a workspace object from json
        return new Workspace(json.name || 'Workplace', json.address, json.location, json.freeWifi, json.coffee, json.food, json.outlets, json.openLate, json.noiseLevel || 'quiet');

    }
}

export default Workspace;