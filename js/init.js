  //JQuery No Conflict
  (function ($) {
   $(document);
  }(jQuery));

  //Loading GIF
  $body = $("body");

  $('table').on({
    ajaxStart: function() { $body.addClass("loading");    },
    ajaxStop: function() { $body.removeClass("loading"); }    
  });


     /****************************************/
    //////////////////////////////////////////
   //////////////////DATA////////////////////
  //////////////////////////////////////////
 /****************************************/

  //Portal URL
  var portalURL = "http://portal.nolagis.opendata.arcgis.com/datasets/03da2b89cb90479a8ef11567c63146c1_0"
  var portalJsonUrl = portalURL + ".json"

  //Initialize Data Variables
  var portalJson;
  var layerJsonURL;
  var layerAttributesJsonURL;
  var layer;
  var restServiceArray;
  var restService;
  var layerID;
  var shapefile;
  var tableFields = [];

  //Handle Data 
  $.getJSON(portalJsonUrl, function(json){

    //Define Data
    portalJson = json;
    layer = portalJson.data.url;
    console.log(layer);
    layerJsonURL = layer + "?callback=?&f=pjson";
    layerAttributesJsonURL = layer + "/query?where=1%3D1&outFields=*&callback=?&f=pjson"
    layerObjectIDsJsonURL = layer + "/query?where=1%3D1&text=&objectIds=&callback=?&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=true&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&f=json"
    restServiceArray = layer.split(/\/*(?=\d$)/);
    restService = restServiceArray[0];
    layerID = restServiceArray[1];
    shapefile = portalJsonUrl.split('.json')[0] + '.zip'

    //Populate Metadata
    $('#layer-name').text(portalJson.data.name);
    $('#service-title').text(portalJson.data.name);
    $('#description').text(portalJson.data.description);
    $('#shape-download').text(shapefile);
    $('#service').html("<a href='" + restService + "' target='_blank'>" + restService + "</a>")
  });

  //Tab display control
  $('#myTab a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  })
     /****************************************/
    //////////////////////////////////////////
   ////////////BEGIN TABLE TAB///////////////
  //////////////////////////////////////////
 /****************************************/

 /*Note: for paging functionality, I borrowed heavily from this Esri sample:
 https://developers.arcgis.com/javascript/jssamples/fl_paging.html*/

  function loadTable(){
    var featureLayer, pageInfo, grid;
    require(["esri/layers/FeatureLayer", 
      "esri/tasks/query", 
      "esri/TimeExtent",
      "dojo/number", 
      "dojo/date/locale", 
      "dojo/dom","dojo/on",
      "dojo/_base/array", 
      "dojo/store/Memory",
      "dgrid/OnDemandGrid", 
      "dojo/domReady!"], 
    function(
      FeatureLayer, 
      Query, 
      TimeExtent,
      number, 
      locale, 
      dom, 
      on,
      arrayUtils, 
      Memory,
      OnDemandGrid
    ) {
       

      featureLayer = new FeatureLayer(layer, {
        outFields:["*"]
      });
       
      //Get layer fields  
      var layerFields = {}
      $.getJSON(layerJsonURL, function(json){
      for (var i = 0; i < json.fields.length; i += 1){
        layerFields[json.fields[i].name] = json.fields[i].name;
          }

        //Generate grid based on field column using layer fields
          grid = new OnDemandGrid({
            store: new Memory({
            idProperty: 0
          }),
          columns:layerFields
          }, "grid");
        });

      // get object IDs from the table (feature layer)
      featureLayer.on("load", function () {
        var query = new Query();
        query.where = "1 = 1";
        featureLayer.queryIds(query, function (objectIds) {
          fetchRecords(objectIds);

        }); //close queryIds
      }); //close featureLayer.on


         ///__________________///
        ///BEGIN PAGE CONTROL///
       ///------------------///

      // click listeners for prev/next page buttons
      on(dom.byId("prev"), "click", function() {
        queryRecordsByPage(pageInfo.currentPage - 1);
      });
      on(dom.byId("next"), "click", function() {
        queryRecordsByPage(pageInfo.currentPage + 1);
      });


      function fetchRecords(objectIds) {
        if (objectIds.length > 0) {
          updatePageInformation(objectIds);
          queryRecordsByPage(1);
        } else {
          grid.showMessage("No matching records");
          grid.setStore(null);
        }
      }

      function updatePageInformation(objectIds, page) {
        pageInfo = {
          objectIds: objectIds,
          totalRecords: objectIds.length,
          totalPages: Math.ceil(objectIds.length / 15),
          currentPage: page || 0,
          recordsPerPage: 15
        };

        dom.byId("pageInfo").innerHTML = pageInfo.currentPage + "/" + pageInfo.totalPages;
        dom.byId("recordsInfo").innerHTML = pageInfo.totalRecords;

        if (pageInfo.currentPage > pageInfo.totalPages) {
          queryRecordsByPage(pageInfo.currentPage - 1);
        }
      }

      function queryRecordsByPage(pageNumber) {
        // check if the page number is valid
        if (pageNumber < 1 || pageNumber > pageInfo.totalPages) {
          return;
        }

        //grid.showMessage("Fetching records...");
        var begin = pageInfo.recordsPerPage * (pageNumber - 1);
        var end = begin + pageInfo.recordsPerPage;

        // create the query
        var query = new Query();
        query.objectIds = pageInfo.objectIds.slice(begin, end);
        query.outFields = ["*"];

        // Query for the records with the given object IDs and populate the grid
        featureLayer.queryFeatures(query, function (featureSet) {
          updateGrid(featureSet, pageNumber);
        });
      }

      function updateGrid(featureSet, pageNumber) {
        var data = arrayUtils.map(featureSet.features, function (entry, i) {
          return featureSet.features[i].attributes;
        });
        grid.store.setData(data);
        grid.refresh();

        // update application state
        pageInfo.currentPage = pageNumber;
        dom.byId("pageInfo").innerHTML = pageInfo.currentPage + "/" + pageInfo.totalPages;
      }

    }); //close require
  } //close loadTable

     /****************************************/
    //////////////////////////////////////////
   ////////////BEGIN MAP TAB/////////////////
  //////////////////////////////////////////
 /****************************************/

  function loadMap(){

    //Begin Map Control
    require(["esri/map", 
      "application/bootstrapmap",
      "esri/layers/ArcGISDynamicMapServiceLayer", 
      "esri/layers/ArcGISTiledMapServiceLayer",
      "esri/layers/FeatureLayer",
      "esri/tasks/query",
      "esri/tasks/QueryTask",
      "dojo/domReady!"], 

    function(Map,
      BootstrapMap,
      ArcGISDynamicMapServiceLayer,
      ArcGISTiledMapServiceLayer,
      Query,
      QueryTask) {
      
    var service = new ArcGISDynamicMapServiceLayer(restService);
    service.setVisibleLayers([layerID]);
    
    var basemap = new ArcGISTiledMapServiceLayer("http://54.197.182.39:6080/arcgis/rest/services/Basemaps/BasemapNOLA3/MapServer");
  
    var map = BootstrapMap.create("nola-map", {
      center: [-90.030, 29.98], // longitude, latitude
      zoom: 12,
      logo: false
    });
      map.addLayer(basemap);
      map.addLayer(service);


    /*Query Test
    var queryTask = new QueryTask(layer);
    var query = new Query();
    query.where = "1=1";
    query.outFields = ["*"];
    queryTask.execute(query, logQuery, function(error){
      console.log(error);
    });
    
    function logQuery(query){  
      console.log('tested');
    }
    
      
    $.getJSON(layerAttributesJsonURL, function(json){console.log(json)});  
    */
  }); //End Map


};
