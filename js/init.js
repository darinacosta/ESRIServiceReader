
  //JQuery No Conflict
  (function ($) {
   $(document);
  }(jQuery));


     /****************************************/
    //////////////////////////////////////////
   //////////////////DATA////////////////////
  //////////////////////////////////////////
 /****************************************/

  //Portal URL
  var portalURL = "http://portal.nolagis.opendata.arcgis.com/datasets/4ce975f8f5cb4f9a928529039008ebf9_0"
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

    //Check if data fields are empty
    function validateMeta(meta){
      if (meta == ""){
        return "<span class='empty-meta'>Empty.</span>"
      }else{
        return meta
      }
    }

    //Populate Metadata
    var $loading = $('#loadingDiv').hide();
    $(document)
      .ajaxStart(function () {
        $loading.show();
      })
      .ajaxStop(function () {
        $('#layer-name').html("<b>Name:</b> " + validateMeta(portalJson.data.name));
        $('#service-title').html(portalJson.data.name);
        $('#description').html("<b>Description:</b> " + validateMeta(portalJson.data.description));
        $('#shape-download').text(shapefile);
        $('#service').html("<b>Service URL:</b> <a href='" + restService + "' target='_blank'>" + restService + "</a>");
        $('#download-button').html("<a href='" + portalURL + ".zip" + "'><img src='img/download.png'></a>")
        $loading.hide();
        $('.container').fadeIn(1000);
      });
  });

  //Tab display control
  $('#myTab a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  })
     /****************************************/
    //////////////////////////////////////////
   ///////////////TABLE TAB//////////////////
  //////////////////////////////////////////
 /****************************************/

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
        }); 
      }); 

          ////////////////////////
         ///==================///
        /// TABLE PAGINATION ///
       ///==================///
      ////////////////////////

      /*Note: for paging functionality, I borrowed heavily from this Esri sample:
      https://developers.arcgis.com/javascript/jssamples/fl_paging.html*/

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
      
      /*gather feature layer metadata into a json object to 
      populate the pageInfo and records info divs*/
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
        // Check if the page number is valid
        if (pageNumber < 1 || pageNumber > pageInfo.totalPages) {
          return;
        }

        var begin = pageInfo.recordsPerPage * (pageNumber - 1);
        var end = begin + pageInfo.recordsPerPage;

        // Create the query
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

        // [current page]/[total pages]
        pageInfo.currentPage = pageNumber;
        dom.byId("pageInfo").innerHTML = pageInfo.currentPage + "/" + pageInfo.totalPages;
      }

    }); //close require
  } //close loadTable

     /****************************************/
    //////////////////////////////////////////
   /////////////////MAP TAB//////////////////
  //////////////////////////////////////////
 /****************************************/

  function loadMap(){

    var $mapLoading = $('#mapLoadingDiv').hide();
    $mapLoading.show();

    //Begin Map Control
    require(["esri/map", 
      "application/bootstrapmap",
      "esri/layers/ArcGISDynamicMapServiceLayer", 
      "esri/layers/ArcGISTiledMapServiceLayer",
      "esri/layers/FeatureLayer",
      "esri/tasks/query",
      "esri/tasks/QueryTask",
      "esri/dijit/Popup",
      "esri/dijit/PopupTemplate",
      "esri/dijit/InfoWindow",
      "esri/InfoTemplate",
      "dojo/domReady!"], 

    function(Map,
      BootstrapMap,
      ArcGISDynamicMapServiceLayer,
      ArcGISTiledMapServiceLayer,
      FeatureLayer,
      Query,
      QueryTask,
      Popup,
      PopupTemplate,
      InfoWindow,
      InfoTemplate) {
    
    //infowindow
    var popup = new Popup({
      offsetX:10,
      offsetY:10,
      zoomFactor:2
    }, dojo.create("div"));
    
    //initialize map
    var map = BootstrapMap.create("nola-map", {
      center: [-90.030, 29.98], // longitude, latitude
      zoom: 12,
      logo: false,
      infoWindow: popup
    });

    var template = new InfoTemplate(portalJson.data.name + " attributes","${*}");
    
    //map layers
    var service = new FeatureLayer(layer, {
      infoTemplate: template,
      outFields: ["*"]
    });
    var basemap = new ArcGISTiledMapServiceLayer("http://54.197.182.39:6080/arcgis/rest/services/Basemaps/BasemapNOLA3/MapServer");
      
    //add layers  
    service.on("load", function(){
      map.addLayer(basemap);
      map.addLayer(service);
      $mapLoading.hide();
      $('.container').fadeIn(1000);
    });

    map.on("resize", function(){
      map.resize();
      map.reposition();
      console.log("resized");
    });
      
  }); //End Map


};
