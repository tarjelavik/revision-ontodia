import * as React from 'react';
import * as Ontodia from 'ontodia';
import * as LZString from 'lz-string';
import {
  WorkspaceProps,
  Workspace,
  CustomTypeStyle,
  DataProvider,
  Dictionary,
  ElementModel,
  SerializedDiagram,
  ElementIri,
  ElementTemplate,
} from 'ontodia';
import { ClassAttributes } from 'react';
// import { Toolbar } from './toolbarCustomization';
import { DefaultToolbar } from './templates/toolbar';
import { TestTemplate } from './templates/testtemplate';
import { PlaceTemplate } from './templates/placetemplate';
import { DefaultTemplate } from './templates/defaulttemplate';
import { startDiagram, birgittaDiagram } from './diagrams';

/**
 * This function returns a color and icon (null everywhere now) to canvas
 *  so that icons can be drawn in the list boxes
 */
const TestTypeStyleBundle = (types: string[]): CustomTypeStyle | undefined => {
  if (
    types.includes('http://www.w3.org/2002/07/owl#Class') ||
    types.includes('http://www.w3.org/2000/01/rdf-schema#Class')
  ) {
    return { color: '#eaac77', icon: null };
  }
  if (types.includes('http://www.w3.org/2002/07/owl#ObjectProperty')) {
    return { color: '#34c7f3', icon: null };
  }
  if (types.includes('http://www.w3.org/2002/07/owl#DatatypeProperty')) {
    return { color: '#34c7f3', icon: null };
  }
  if (
    types.includes('http://xmlns.com/foaf/0.1/Person') ||
    types.includes('http://purl.org/bdm2Person') ||
    types.includes('http://purl.org/bdm2/Person')
  ) {
    return { color: '#eb7777', icon: './icons/user-svgrepo-com.svg' };
  }
  if (
    types.includes('http://schema.org/Organization') ||
    types.includes('http://dbpedia.org/ontology/Organisation') ||
    types.includes('http://xmlns.com/foaf/0.1/Organization') ||
    types.includes('http://purl.org/bdm2Institution') ||
    types.includes('http://purl.org/bdm2/Institution') ||
    types.includes('http://purl.org/bdm2ModernInstitution') ||
    types.includes('http://purl.org/bdm2/ModernInstitution')
  ) {
    return {
      color: '#77ca98',
      icon: './icons/library-building-svgrepo-com.svg',
    };
  }
  if (
    types.includes('http://www.wikidata.org/entity/Q618123') ||
    types.includes('http://www.w3.org/2003/01/geo/wgs84_pos#Point') ||
    types.includes('http://purl.org/bdm2Place') ||
    types.includes('http://purl.org/bdm2/Place')
  ) {
    return { color: '#bebc71', icon: './icons/pin-svgrepo-com.svg' };
  }
  if (
    types.includes('http://purl.org/bdm2Work') ||
    types.includes('http://purl.org/bdm2/Work')
  ) {
    return { color: '#DA4167', icon: './icons/work-svgrepo-com.svg' };
  }
  if (
    types.includes('http://purl.org/bdm2BookObject') ||
    types.includes('http://purl.org/bdm2/BookObject')
  ) {
    return { color: '#F4D35E', icon: './icons/book-item-svgrepo-com.svg' };
  }
  if (
    types.includes('http://purl.org/bdm2WorkItem') ||
    types.includes('http://purl.org/bdm2/WorkItem')
  ) {
    return { color: '#F6D8AE', icon: './icons/work-item-svgrepo-com.svg' };
  }
  if (
    types.includes('http://purl.org/bdm2Action') ||
    types.includes('http://purl.org/bdm2/Action')
  ) {
    return { color: '#083D77', icon: './icons/action-svgrepo-com.svg' };
  }
  if (types.includes('http://schema.org/Event')) {
    return { color: '#2E4057', icon: './icons/event-svgrepo-com.svg' };
  }
  return;
};

/**
 * ontodia function fired when the workspace is mounted, this is the point where the
 * data initialization takes place
 */
function onWorkspaceMounted(workspace: Workspace) {
  if (!workspace) {
    return;
  }

  /**
   * the internal model (not related to rdf-js)
   */
  const model = workspace.getModel();
  /**
   * see https://github.com/metaphacts/ontodia/blob/master/src/ontodia/data/sparql/sparqlDataProviderSettings.ts
   *
   * we pickup the OWLRDFSSetting and replace some of the queries with stardog variants
   */
  const SparqlDialect = Ontodia.OWLRDFSSettings;

  SparqlDialect.defaultPrefix = `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX owl:  <http://www.w3.org/2002/07/owl#>
    PREFIX dcterms:  <http://purl.org/dc/terms/>
    PREFIX o:  <http://omeka.org/s/vocabs/o#>
    PREFIX schema:  <http://schema.org/>

    `;

  /*   SparqlDialect.classTreeQuery = `
    SELECT distinct ?class ?label ?parent WHERE {
      ?inst a ?class . 
    }
  ` */

  /**
   * simple regex query on labels
   */
  SparqlDialect.fullTextSearch = {
    prefix: '',
    queryPattern: `
            ?inst rdfs:label
              | <http://purl.org/bdm2/shelfmark>
              | <http://purl.org/dc/terms/title>
              | <http://omeka.org/s/vocabs/o#title>
              | <http://schema.org/object>/<http://omeka.org/s/vocabs/o#title>
              | <http://schema.org/name>/<http://omeka.org/s/vocabs/o#label> ?searchLabel.
            FILTER regex(?searchLabel, "\${text}", "i")
            `,
  };
  /**
   * replace filter type for performance improvements
   */
  SparqlDialect.filterTypePattern = '?inst a ?class';

  /**
   * Add all strings used as labels in Birgitta dataset :-(
   */
  SparqlDialect.dataLabelProperty =
    'rdfs:label|<http://purl.org/bdm2/shelfmark>|<http://purl.org/dc/terms/title>|<http://omeka.org/s/vocabs/o#title>|<http://schema.org/object>/<http://omeka.org/s/vocabs/o#title>|<http://schema.org/name>/<http://omeka.org/s/vocabs/o#label>';

  /**
   * Filter Omeka props
   */
  SparqlDialect.linkTypesOfQuery = `SELECT DISTINCT ?link
  WHERE {
    {
      \${elementIri} ?link ?outObject
      # this is to prevent some junk appear on diagram,
      # but can really slow down execution on complex objects
      FILTER(?link NOT IN (<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>, <http://omeka.org/s/vocabs/o#owner>, <http://omeka.org/s/vocabs/o#resource_template>, <http://omeka.org/s/vocabs/o#resource_class>))
      #FILTER ISIRI(?outObject)
      #FILTER EXISTS { ?outObject ?someprop ?someobj }
    } UNION {
      ?inObject ?link \${elementIri}
      FILTER(?link NOT IN (<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>, <http://omeka.org/s/vocabs/o#owner>, <http://omeka.org/s/vocabs/o#resource_template>, <http://omeka.org/s/vocabs/o#resource_class>))
      #FILTER ISIRI(?inObject)
      #FILTER EXISTS { ?inObject ?someprop ?someobj }
    }
  }`;

  (SparqlDialect.filterTypePattern =
    '?inst a ?instType. ?instType <http://www.w3.org/2000/01/rdf-schema#subClassOf>* ?class'),
    /**
     * Filter omeka objects
     */
    (SparqlDialect.filterRefElementLinkPattern =
      'FILTER(?link NOT IN (<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>, <http://omeka.org/s/vocabs/o#owner>, <http://omeka.org/s/vocabs/o#resource_template>, <http://omeka.org/s/vocabs/o#resource_class>)) . FILTER(?inst != <http://omeka.org/s/vocabs/o#Item>)');

  /**
   * Add public endpoint and refer to our modified dialect
   */
  const initialLayout: {
    dataProvider: DataProvider;
    preloadedElements?: Dictionary<ElementModel>;
    validateLinks?: boolean;
    diagram?: SerializedDiagram;
    hideUnusedLinkTypes?: boolean;
  } = {
    dataProvider: new Ontodia.SparqlDataProvider(
      {
        endpointUrl:
          'https://sparql.birgitta.uib.no/birgitta-revision-test/query',
        queryMethod: Ontodia.SparqlQueryMethod.GET,
      },
      SparqlDialect
    ),
    diagram: JSON.parse(LZString.decompressFromBase64(birgittaDiagram)),
  };

  // load serialized data from URL if any
  const url = new URL(window.location.href);
  const serialized = (url.hash || '').substr(1);
  if (serialized.length) {
    initialLayout.diagram = JSON.parse(
      LZString.decompressFromBase64(serialized)
    ) as SerializedDiagram;
  }
  model.importLayout(initialLayout);

  /**
   * get the '?resource' search param and load that resource.
   */
  const resource = url.searchParams.get('resource') as ElementIri;
  if (resource) {
    const elm = workspace
      .getModel()
      .dataProvider.elementInfo({ elementIds: [resource] });
    elm.then((arg: { [x: string]: any }) => {
      workspace.getModel().createElement(arg[resource]);
      workspace.forceLayout();
    });
  }
}

/**
 * based on a type return a template to render the specific type
 */
function templateResolver(types: string[]): ElementTemplate | undefined {
  // if we have geos:Geometry then use the test template to draw a map, all other default
  if (types.includes('http://purl.org/bdm2/Place')) {
    // see templates/testtemplate.tsx
    return PlaceTemplate;
  }
  // see defaulttemplate.tsx
  return DefaultTemplate;
}

/**
 * properties for the ReactJS component creation
 */
export const workspaceProps: WorkspaceProps & ClassAttributes<Workspace> = {
  // function to call when workspace is mounted
  ref: onWorkspaceMounted,
  // Typestyleresolver ( see above )
  typeStyleResolver: TestTypeStyleBundle,
  // resolver for templates ( see below )
  elementTemplateResolver: templateResolver,
  languages: [{ code: 'en', label: 'English' }],
  language: 'en',
  onSaveDiagram: (workspace) => {
    console.log(LZString);
    const diagramToSave = workspace.getModel().exportLayout();
    const serializedDiagram = LZString.compressToBase64(
      JSON.stringify(diagramToSave)
    );
    return serializedDiagram;
  },
  toolbar: <DefaultToolbar />,
};
