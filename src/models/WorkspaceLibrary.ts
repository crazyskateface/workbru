import Workspace from './Workspace';
const workspaceLibrary = {
    // list of workspaces
    spaces : [] as Workspace[],
    //constructor 
    init : function() {
        this.spaces = [];
    },
    // add a workspace
    addWorkspace : function(workspace:Workspace) {
        this.spaces.push(workspace);
    },
    // remove a workspace
    removeWorkspace : function(workspace:Workspace) {
        this.spaces = this.spaces.filter(w => w !== workspace);
    },
    // get all workspaces
    getWorkspaces : function() {
        return this.spaces;
    },
    // get a workspace by name
    getWorkspaceByName : function(name:string) {
        return this.spaces.find(w => w.getName() === name);
    },
    // get a workspace by location
    getWorkspaceByLocation : function(location:google.maps.LatLngLiteral) {
        return this.spaces.find(w => w.getLocation() === location);
    },
    // get a workspace by key
    getWorkspaceByKey : function(key:string) {
        return this.spaces.find(w => w.poi.key === key);
    },
    // get workspaces by filter
    getWorkspacesByFilter : function(filter:Function) {
        return this.spaces.filter((space) => filter(space));
    },
    // load workspaces from json
    setWorkspaces : function(data:any[]) {
        data.forEach((item:any) => {
            this.addWorkspace(Workspace.fromJson(item));
        })
    }
}

export default workspaceLibrary;