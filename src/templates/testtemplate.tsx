/* template.tsx */
import * as React from 'react';
import {
  ElementIri,
  ElementModel,
  Dictionary,
  Property,
} from '../../node_modules/ontodia/src/ontodia/data/model';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';

export type PropArray = Array<{
  id: string;
  name: string;
  property: Property;
}>;

export interface TemplateProps {
  elementId: string;
  data: ElementModel;
  iri: ElementIri;
  types: string;
  label: string;
  color: any;
  iconUrl: string;
  imgUrl?: string;
  isExpanded?: boolean;
  propsAsList?: PropArray;
  props?: Dictionary<Property>;
}

export class TestTemplate extends React.Component<TemplateProps, {}> {
  componentDidMount(): void {
    // create map
    const long = this.props.propsAsList.map(({ name, id, property }) => {
      if (id === 'http://schema.org/longitude') {
        return +property.values[0].value;
      }
    });
    const lat = this.props.propsAsList.map(({ name, id, property }) => {
      if (id === 'http://schema.org/latitude') {
        return +property.values[0].value;
      }
    });

    const coord = {
      x: lat.filter(Boolean)[0],
      y: long.filter(Boolean)[0],
    };

    const map = L.map('map-' + this.props.elementId, {
      center: [coord.x, coord.y],
      zoom: 16,
      layers: [
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OSM',
        }),
      ],
    });
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) map.tap.disable();
    L.marker([coord.x, coord.y]).addTo(map);
  }

  render(): JSX.Element {
    const propsAsList = this.props.propsAsList
      .map(({ name, id, property }) => {
        if (id == 'http://www.opengis.net/ont/geosparql#asWKT') {
          return property.values[0].value;
        }
      })
      .filter(Boolean);
    return (
      <div
        className="ontodia-standard-template"
        style={{ borderColor: this.props.color }}
      >
        <div className={this.props.iconUrl} />
        <div className="example-label">
          {this.props.label}
          {propsAsList}
          <div id={'map-' + this.props.elementId} className="geo_point" />
        </div>
      </div>
    );
  }
}
