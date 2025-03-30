import { useEffect, useState } from "react";
import MapView from "../mapView/MapView";
import './styles.css';
import { Place } from "../../models/place";

type homeviewProps = {

}

const HomeView = (props:homeviewProps) => {
    const [mainOpen, setMainOpen] = useState(false);
    const [space, setSpace] = useState<Place | null>(null);

    useEffect(() => {

    }, [mainOpen])

    const toggleMain = () => {
        setMainOpen((prev:boolean) => !prev)
    }

    const poiViewing = (space:Place) => {
        console.log("viewing place: ", space.name);
        setSpace(space);
        return {}; // Return empty object to satisfy the MapView prop type
    }

    return (
        <section className="HomeViewSection">

            <div id="MapView">
                <MapView
                 poiViewing={poiViewing}
                 
                 ></MapView>
            </div>

           <div id="main" 
            style={{height: mainOpen ? "80vh" : "10vh"}}
            
            >  
                <div id="mainBtn" 
                    onClick={toggleMain}
                    className={mainOpen?"mainBtnOpen":"mainBtnClosed"}
                >
                    <i  className={mainOpen?"arrow down":"arrow up"}>
                    </i>
                </div>  
                <div id="mainContent"
                    onClick={() => {mainOpen?console.log(""):toggleMain}}
                 >
                    <div id="mainHeader">
                        <h2>{space && space.name}</h2>
                    </div>
                    <div id="mainBody">
                        <p>
                            Address: {space && space.address}

                        </p>

                        {/* AMENITIES */}
                        <div>
                            Amenities: Amenity
                        </div>
                        {/* ATTRIBUTES */}
                        <div>
                            Attributes: Attribute
                        </div>
                    </div>
                </div>
                
            </div>

        </section>
    )
}

export default HomeView;