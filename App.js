Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function () {
        //Write app code here
        //API Docs: https://help.rallydev.com/apps/2.1/doc/
        this.iterationCombobox = this.add({
            xtype: 'rallyiterationcombobox',
            context: this.getContext(),
            listeners: {
                ready: this._onIterationComboboxChanged,
                select: this._onIterationComboboxChanged,
                scope: this
            }
        });
    },
    _onIterationComboboxChanged: function () {        
        let that = this;
        this.getSnapshotStore().load().then({
            success: function (records) {
                let customRecords = that.getCustomStoreRecords(records);                
                let customStore = Ext.create('Rally.data.custom.Store', {
                    data: customRecords
                });                                
                var mygrid = this.down('rallygrid');
                that.remove(mygrid);

                var gridConfig = this.getGrid(customStore);
                that.grid = that.add(gridConfig);                
            },
            scope: this
        }
        );
    },
    getSnapshotStore: function () {
        let that = this;
        let iterid = parseInt(this.iterationCombobox.value.split("/")[2]);
        let snapshotStore = Ext.create('Rally.data.lookback.SnapshotStore', {
            that: that,
            fetch: ['FormattedID', 'Name', 'ScheduleState', 'Iteration'],
            //autoLoad: true,
            compress: true,
            context: {
                workspace: this.getContext().getWorkspace(),
                project: this.getContext().getProject(),
                projectScopeUp: this.getContext().getProjectScopeUp(),
                projectScopeDown: this.getContext().getProjectScopeDown(),
            },
            filters: [
                {
                    property: 'Blocked',
                    operator: '=',
                    value: true
                },
                {
                    property: 'Iteration',
                    operator: '=',
                    value: iterid
                },
            ],
            sorters: [
                {
                    property: 'ObjectID'
                },
                {
                    property: '_ValidFrom',
                    direction: 'DESC'
                }
            ],
            listeners:
            {
                load: function (store, records) {
                    //console.log("LOAD!");
                },
            },
            hydrate: ['ScheduleState','Iteration']

        });

        return snapshotStore;
    },
    date_diff_indays: function (date1, date2) {
        let dt1 = new Date(date1);
        let dt2 = new Date(date2);
        if (dt1.getFullYear() === 9999) {
            dt1 = new Date();
        }
        if (dt2.getFullYear() === 9999) {
            dt2 = new Date();
        }
        //return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), 
        //               dt1.getMonth(), dt1.getDate())) / (1000 * 60 * 60 * 24));
        return Math.floor((dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60 * 24));
    },
    getCustomStoreRecords: function (records) {
        let r_plus = {};
        Ext.define('grouped_snapshots', {
            extend: 'Rally.data.Model',
            fields: [
                { name: 'FormattedID', type: 'string' },
                { name: 'ObjectID', type: 'int', convert: null },
                { name: 'ScheduleState', type: 'string' },
                { name: 'Iteration', type: 'string' },
                { name: 'Name', type: 'String', defaultValue: true, convert: null },
                { name: 'DaysBlocked', type: 'int', defaultValue: 0 }
            ],
            isUpdatable: function(){
                console.log("No ...")
                return false
            }
        });

        for (var record of records) {
            // Init record for every formatedID
            if (r_plus[record.get("FormattedID")] === undefined) {
                r_plus[record.get("FormattedID")] = Ext.create('grouped_snapshots',{});                
                Ext.apply(r_plus[record.get("FormattedID")].data, record.getData());
                r_plus[record.get("FormattedID")].set("Iteration",record.get("Iteration").Name);
            }

            r_plus[record.data.FormattedID].data.DaysBlocked = r_plus[record.data.FormattedID].data.DaysBlocked +
                this.date_diff_indays(record.data._ValidFrom, record.data._ValidTo);
        }
        return Object.values(r_plus);
    },
    getGrid: function (customStore){

        let gridConfig = {
            xtype: 'rallygrid',
            autoScroll: true,
            showPagingToolbar: false,
            enableEditing: false, 
            editable: false,           
            columnCfgs: [
                {
                    text: 'ID',
                    dataIndex: 'FormattedID',
                    width: 100,
                },
                {
                    text: 'Name',
                    dataIndex: 'Name',
                    flex: 1
                },
                {
                    text: 'Schedule State',
                    dataIndex: 'ScheduleState'
                },
                {
                    text: 'Blocked on Iteration',
                    dataIndex: 'Iteration'
                },
                {
                    text: 'Days Blocked',
                    dataIndex: 'DaysBlocked'
                },
            ],
            store: customStore,
            listeners:
            { load: function (store) {},
            }

        };
        return gridConfig;
    }

});