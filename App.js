Ext.define('BlockedDays', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function () {
        //Write app code here
        //API Docs: https://help.rallydev.com/apps/2.1/doc/

        this.iterationCombobox = this.add({
            xtype: 'rallyiterationcombobox',
            context: this.getContext().getDataContext(),
            listeners: {
                ready: this._onIterationComboboxChanged,
                select: this._onIterationComboboxChanged,
                scope: this
            }
        });
    },
    _onIterationComboboxChanged: function () {
        let that = this;
        if (this.grid) {
            this.grid.setLoading(true);
        }

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
                that.grid.setLoading(false);
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
            //context: this.getContext().getDataContext(),
            context: {
                workspace: this.getContext().getWorkspace(),
                project: this.getContext().getProject(),
                projectScopeUp: this.getContext().getProjectScopeUp(),
                projectScopeDown: this.getContext().getProjectScopeDown(),
            },
            filters: [
                {
                    property: '_TypeHierarchy',
                    value: 'HierarchicalRequirement'
                },
                {
                    property: 'Blocked',
                    value: true
                },
                {
                    property: 'Iteration',
                    value: iterid
                },
                //{
                //    property: '_ValidFrom',
                //    operator: '>',
                //    value:
//
                //}
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
    date_diff_indays: function (date1, date2, iterStartDate, iterEndDate) {
        let dt1 = new Date(date1);
        let dt2 = new Date(date2);
        let iterStart = new Date(iterStartDate);
        let iterEnd = new Date(iterEndDate);

        let outOfBounds = false;
        if (dt1.getFullYear() === 9999) {
            dt1 = new Date();
        }
        if (dt2.getFullYear() === 9999) {
            dt2 = new Date();
        }
        if (dt1.getTime() < iterStart.getTime()) {
            dt1 = iterStart;
            outOfBounds = true;
        }
        if (dt2.getTime() < iterStart.getTime()) {
            dt2 = iterStart;
            outOfBounds = true;
        }
        if (dt1.getTime() > iterEnd.getTime()) {
            dt1 = iterEnd;
            outOfBounds = true;
        }

        if (dt2.getTime() > iterEnd.getTime()){
            dt2 = iterEnd;
            outOfBounds = true;
        }


        if (outOfBounds){
            console.log(date1, date2, iterStartDate, iterEndDate);
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
                console.log("No ...");
                return false;
            }
        });

        for (var record of records) {
            // Init record for every formatedID
            let formattedID = record.get("FormattedID")
            if (r_plus[formattedID] === undefined) {
                r_plus[formattedID] = Ext.create('grouped_snapshots',{});
                Ext.apply(r_plus[formattedID].data, record.getData());
                r_plus[formattedID].set("Iteration",record.get("Iteration").Name);
            }

            r_plus[formattedID].data.DaysBlocked = r_plus[formattedID].data.DaysBlocked +
                this.date_diff_indays(record.data._ValidFrom,
                    record.data._ValidTo,
                    record.get("Iteration").StartDate,
                    record.get("Iteration").EndDate);
        }

        Object.keys(r_plus).forEach(fid => {
            if (r_plus[fid].data.DaysBlocked === 0) {
                delete r_plus[fid];
            }
        });

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