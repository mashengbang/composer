/*
 * (c) 2014 Boundless, http://boundlessgeo.com
 */
angular.module('gsApp.workspaces.maps.settings', [])
.controller('EditMapSettingsCtrl', ['workspace', 'map', '$scope', '$rootScope',
  '$state', '$log', '$modalInstance', 'GeoServer', 'AppEvent',
    function(workspace, map, $scope, $rootScope, $state, $log, $modalInstance,
      GeoServer, AppEvent) {

      $scope.workspace = workspace;
      $scope.map = map;
      $scope.mapname = map.name;

      $scope.form = {};
      $scope.form.mapSettings = {};
      var originalMap = angular.copy($scope.map);

      $scope.crsTooltip =
      '<h5>Add a projection in EPSG</h5>' +
      '<p>Coordinate Reference System (CRS) info is available at ' +
        '<a href="http://prj2epsg.org/search" target="_blank">' +
          'http://prj2epsg.org' +
        '</a>' +
      '</p>';

      $scope.saveChanges = function() {
        // clear any error state
        $scope.form.mapSettings.alerts = null;

        if ($scope.form.mapSettings.$dirty) {
          var patch = { 'bbox': {}, 'center': [2] };
          if (originalMap.name !== $scope.map.name) {
            patch.name = $scope.map.name;
          }
          if (originalMap.title !== $scope.map.title) {
            patch.title = $scope.map.title;
          }

          if (originalMap.bbox !== $scope.map.bbox) {
            patch.proj = $scope.map.proj.srs;
            patch.bbox.south = $scope.map.bbox.south;
            patch.bbox.west = $scope.map.bbox.west;
            patch.bbox.north = $scope.map.bbox.north;
            patch.bbox.east = $scope.map.bbox.east;
          }

          if (originalMap.description !== $scope.map.description) {
            patch.description = $scope.map.description;
          }

          GeoServer.map.update($scope.workspace, originalMap.name, patch).then(
            function(result) {
              if (result.success) {
                $scope.form.mapSettings.saved = true;
                $scope.form.mapSettings.$setPristine();
                $rootScope.$broadcast(AppEvent.MapUpdated, {
                  'original': originalMap,
                  'new': $scope.map
                });
                originalMap = angular.copy($scope.map);
              } else {
                $scope.form.mapSettings.alerts = 'Map update failed: ' +
                  result.data.message;
                $rootScope.alerts = [{
                  type: 'danger',
                  message: 'Map update failed: ' + result.data.message,
                  fadeout: true
                }];
                // Reset settings to original
                $scope.map.name = originalMap.name;
                $scope.map.title = originalMap.title;
                $scope.map.proj = originalMap.proj;
                $scope.map.bbox.south = originalMap.bbox.south;
                $scope.map.bbox.north = originalMap.bbox.north;
                $scope.map.bbox.east = originalMap.bbox.east;
                $scope.map.bbox.west = originalMap.bbox.west;
                $scope.map.description = originalMap.description;
              }
            });
        }
      };

      $scope.deleteMap = function (map) {
        GeoServer.map.delete($scope.workspace, map.name, {'name': map.name})
        .then(function(result) {
            if (result.success) {
              $rootScope.$broadcast(AppEvent.MapsAllUpdated, result.data);
              $rootScope.alerts = [{
                type: 'success',
                message: 'Map ' + map.name + ' successfully deleted.',
                fadeout: true
              }];
              $modalInstance.dismiss('close');
            } else {
              $rootScope.alerts = [{
                type: 'danger',
                message: 'Map could not be deleted.',
                fadeout: true
              }];
            }
          });
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
