import * as moment from 'moment';
import * as React from 'react';
import {
  ElementIri,
  ElementModel,
  Dictionary,
  Property,
  isIriProperty,
  isLiteralProperty,
} from 'ontodia';
import { isEncodedBlank } from 'ontodia/src/ontodia/data/sparql/blankNodes';
const CLASS_NAME = 'ontodia-standard-template';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';

/* Place Template from Ontodia */

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
  color: string;
  iconUrl: string;
  imgUrl?: string;
  isExpanded?: boolean;
  propsAsList?: PropArray;
  props?: Dictionary<Property>;
}

export class PlaceTemplate extends React.Component<TemplateProps, {}> {
  componentDidMount(): void {
    // create map
    const long = this.props.propsAsList.map(({ name, id, property }) => {
      if (id === 'http://schema.org/longitude') {
        return +property.values[0].value;
      }
    })
    const lat = this.props.propsAsList.map(({ name, id, property }) => {
      if (id === 'http://schema.org/latitude') {
        return +property.values[0].value;
      }
    })

    const coord = {
      x: lat.filter(Boolean)[0],
      y: long.filter(Boolean)[0]
    }
 
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
    return this.renderTemplate();
  }

  private renderTemplate(): JSX.Element {
    const { color, types, isExpanded, iri, propsAsList } = this.props;
    const label = this.getLabel();

    return (
      <div className={CLASS_NAME}>
        <div
          className={`${CLASS_NAME}__main`}
          style={{ backgroundColor: color, borderColor: color }}
        >
          <div
            className={`${CLASS_NAME}__body`}
            style={{ borderLeftColor: color }}
          >
            <div className={`${CLASS_NAME}__body-horizontal`}>
              {this.renderThumbnail()}
              <div className={`${CLASS_NAME}__body-content`}>
                <div title={types} className={`${CLASS_NAME}__type`}>
                  <div className={`${CLASS_NAME}__type-value`}>
                    {this.getTypesLabel()}
                  </div>
                </div>
                <div className={`${CLASS_NAME}__label`} title={label}>
                  {label}
                </div>
              </div>
            </div>
                <div id={'map-' + this.props.elementId} className="geo_point" />
          </div>
        </div>
        {isExpanded ? (
          <div
            className={`${CLASS_NAME}__dropdown`}
            style={{ borderColor: color }}
          >
            {this.renderPhoto()}
            <div className={`${CLASS_NAME}__dropdown-content`}>
              {this.renderIri()}
              {this.renderProperties(propsAsList)}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  private renderIri(): JSX.Element {
    const { iri } = this.props;
    const finalIri = iri;
    return (
      <div>
        <div className={`${CLASS_NAME}__iri`}>
          <div className={`${CLASS_NAME}__iri-key`}>IRI:</div>
          <div className={`${CLASS_NAME}__iri-value`}>
            {isEncodedBlank(finalIri) ? (
              <span>(blank node)</span>
            ) : (
              <a
                href={finalIri}
                title={finalIri}
                data-iri-click-intent="openEntityIri"
              >
                {finalIri}
              </a>
            )}
          </div>
        </div>
        <hr className={`${CLASS_NAME}__hr`} />
      </div>
    );
  }

  private renderProperties(propsAsList: PropArray): JSX.Element {
    if (!propsAsList.length) {
      return <div>no properties</div>;
    }

    return (
      <div className={`${CLASS_NAME}__properties`}>
        {propsAsList.map(({ name, id, property }) => {
          const propertyValues = this.getPropertyValues(property);
          return (
            <div key={id} className={`${CLASS_NAME}__properties-row`}>
              <div
                className={`${CLASS_NAME}__properties-key`}
                title={`${name} (${id})`}
              >
                {name}
              </div>
              <div className={`${CLASS_NAME}__properties-values`}>
                {propertyValues.map((text, index) => (
                  <div
                    className={`${CLASS_NAME}__properties-value`}
                    key={index}
                    title={text}
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  private renderPhoto(): JSX.Element {
    const { color, imgUrl } = this.props;

    if (!imgUrl) {
      return null;
    }

    return (
      <div className={`${CLASS_NAME}__photo`} style={{ borderColor: color }}>
        <img src={imgUrl} className={`${CLASS_NAME}__photo-image`} />
      </div>
    );
  }

  private renderThumbnail(): JSX.Element {
    const { color, imgUrl, iconUrl } = this.props;

    if (imgUrl) {
      return (
        <div className={`${CLASS_NAME}__thumbnail`} aria-hidden="true">
          <img src={imgUrl} className={`${CLASS_NAME}__thumbnail-image`} />
        </div>
      );
    }
    if (iconUrl) {
      return (
        <div className={`${CLASS_NAME}__thumbnail`} aria-hidden="true">
          <img src={iconUrl} className={`${CLASS_NAME}__thumbnail-icon`} />
        </div>
      );
    }

    const typeLabel = this.getTypesLabel();
    return (
      <div
        className={`${CLASS_NAME}__thumbnail`}
        aria-hidden="true"
        style={{ color }}
      >
        {typeLabel.length > 0 ? typeLabel.charAt(0).toUpperCase() : '✳'}
      </div>
    );
  }

  protected getTypesLabel(): string {
    return this.props.types;
  }

  private getLabel(): string {
    const { label, props } = this.props;
    return label;
  }

  private getProperty(props: Dictionary<Property>, id: string): string {
    if (props && props[id]) {
      return this.getPropertyValues(props[id]).join(', ');
    }
    return;
  }

  private getPropertyValues(property: Property): string[] {
    if (isIriProperty(property)) {
      return property.values.map(({ value }) => value);
    }
    if (isLiteralProperty(property)) {
      return property.values.map((value) => {
        if (
          value.datatype.value === 'http://www.w3.org/2001/XMLSchema#dateTime'
        ) {
          return moment(value.value).format('MMM D YYYY HH:mm:ssA');
        }
        return value.value;
      });
    }
    return [];
  }
}

interface PinnedProperties {
  [propertyId: string]: boolean;
}
