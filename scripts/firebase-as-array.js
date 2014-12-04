/*! Firebase.getAsArray - v0.1.0 - 2014-04-21
* Copyright (c) 2014 Kato
* MIT LICENSE */

(function(exports) {

  exports.getAsArray = function(ref, eventCallback) {
    return new ReadOnlySynchronizedArray(ref, eventCallback).getList();
  };

  function ReadOnlySynchronizedArray(ref, eventCallback) {
    this.list = [];
    this.subs = []; // used to track event listeners for dispose()
    this.ref = ref;
    this.eventCallback = eventCallback;
    this._wrapList();
    this._initListeners();
  }

  ReadOnlySynchronizedArray.prototype = {
    getList: function() {
      return this.list;
    },

    add: function(data) {
      var key = this.ref.push().key();
      var ref = this.ref.child(key);
      if( arguments.length > 0 ) { ref.set(parseForJson(data), this._handleErrors.bind(this, key)); }
        return ref;
      },

      set: function(key, newValue) {
        this.ref.child(key).set(parseForJson(newValue), this._handleErrors.bind(this, key));
      },

      update: function(key, newValue) {
        this.ref.child(key).update(parseForJson(newValue), this._handleErrors.bind(this, key));
      },

      setPriority: function(key, newPriority) {
        this.ref.child(key).setPriority(newPriority);
      },

      remove: function(key) {
        this.ref.child(key).remove(this._handleErrors.bind(null, key));
      },

      posByKey: function(key) {
        return findKeyPos(this.list, key);
      },

      placeRecord: function(key, prevId) {
        if( prevId === null ) {
          return 0;
        }
        else {
          var i = this.posByKey(prevId);
          if( i === -1 ) {
            return this.list.length;
          }
          else {
            return i+1;
          }
        }
      },

      getRecord: function(key) {
        var i = this.posByKey(key);
        if( i === -1 ) return null;
        return this.list[i];
      },

      dispose: function() {
        var ref = this.ref;
        this.subs.forEach(function(s) {
          ref.off(s[0], s[1]);
        });
        this.subs = [];
      },

      _serverAdd: function(snap, prevId) {
        var data = parseVal(snap.key(), snap.val());
        this._moveTo(snap.key(), data, prevId);
        this._handleEvent('child_added', snap.key(), data);
      },

      _serverRemove: function(snap) {
        var pos = this.posByKey(snap.key());
        if( pos !== -1 ) {
          this.list.splice(pos, 1);
          this._handleEvent('child_removed', snap.key(), this.list[pos]);
        }
      },

      _serverChange: function(snap) {
        var pos = this.posByKey(snap.key());
        if( pos !== -1 ) {
          this.list[pos] = applyToBase(this.list[pos], parseVal(snap.key(), snap.val()));
          this._handleEvent('child_changed', snap.key(), this.list[pos]);
        }
      },

      _serverMove: function(snap, prevId) {
        var id = snap.key();
        var oldPos = this.posByKey(id);
        if( oldPos !== -1 ) {
          var data = this.list[oldPos];
          this.list.splice(oldPos, 1);
          this._moveTo(id, data, prevId);
          this._handleEvent('child_moved', snap.key(), data);
        }
      },

      _moveTo: function(id, data, prevId) {
        var pos = this.placeRecord(id, prevId);
        this.list.splice(pos, 0, data);
      },

      _handleErrors: function(key, err) {
        if( err ) {
          this._handleEvent('error', null, key);
          console.error(err);
        }
      },

      _handleEvent: function(eventType, recordId, data) {
        // console.log(eventType, recordId);
        this.eventCallback && this.eventCallback(eventType, recordId, data);
      },

      _wrapList: function() {
        this.list.$indexOf = this.posByKey.bind(this);
        this.list.$add = this.add.bind(this);
        this.list.$remove = this.remove.bind(this);
        this.list.$set = this.set.bind(this);
        this.list.$update = this.update.bind(this);
        this.list.$move = this.setPriority.bind(this);
        this.list.$rawData = function(key) { return parseForJson(this.getRecord(key)) }.bind(this);
        this.list.$off = this.dispose.bind(this);
      },

      _initListeners: function() {
        this._monit('child_added', this._serverAdd);
        this._monit('child_removed', this._serverRemove);
        this._monit('child_changed', this._serverChange);
        this._monit('child_moved', this._serverMove);
      },

      _monit: function(event, method) {
        this.subs.push([event, this.ref.on(event, method.bind(this))]);
      }
    };

    function applyToBase(base, data) {
      // do not replace the reference to objects contained in the data
      // instead, just update their child values
      if( isObject(base) && isObject(data) ) {
        var key;
        for(key in base) {
          if( key !== '$id' && base.hasOwnProperty(key) && !data.hasOwnProperty(key) ) {
            delete base[key];
          }
        }
        for(key in data) {
          if( data.hasOwnProperty(key) ) {
            base[key] = data[key];
          }
        }
        return base;
      }
      else {
        return data;
      }
    }

    function isObject(x) {
      return typeof(x) === 'object' && x !== null;
    }

    function findKeyPos(list, key) {
      for(var i = 0, len = list.length; i < len; i++) {
        if( list[i].$id === key ) {
          return i;
        }
      }
      return -1;
    }

    function parseForJson(data) {
      if( data && typeof(data) === 'object' ) {
        delete data['$id'];
        if( data.hasOwnProperty('.value') ) {
          data = data['.value'];
        }
      }
      if( data === undefined ) {
        data = null;
      }
      return data;
    }

    function parseVal(id, data) {
      if( typeof(data) !== 'object' || !data ) {
        data = { '.value': data };
      }
      data['$id'] = id;
      return data;
    }
  })(typeof(window)==='undefined'? exports : window.Firebase);
  
