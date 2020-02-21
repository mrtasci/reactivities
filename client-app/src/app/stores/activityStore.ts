import { observable, action, computed, configure, runInAction } from "mobx";
import { createContext, SyntheticEvent } from "react";
import { IActivity } from "../models/activity";
import agent from "../api/agent";

configure({ enforceActions: 'always' });

class ActivityStore {
    @observable activityRegistry = new Map();
    @observable target: string = "";
    @observable activities: IActivity[] = [];
    @observable loadingInitial: boolean = false;
    @observable submitting: boolean = false;
    @observable selectedActivity: IActivity | undefined;
    @observable editMode: boolean = false;

    @computed get activitiesByDate() {
        return Array.from(this.activityRegistry.values())
            .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    }

    @action loadActivities = async () => {
        this.loadingInitial = true;
        try {
            const activities = await agent.Activities.list();
            runInAction('loading activities', () => {
                activities.forEach(activity => {
                    activity.date = activity.date.split(".")[0];
                    this.activityRegistry.set(activity.id, activity);
                });
            });

        } catch (error) {
            console.error(error);
        } finally {
            runInAction('load activities final', () => {
                this.loadingInitial = false;
            });
        }

    }

    @action createActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.create(activity);
            runInAction('creating activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.editMode = false;
            });


        } catch (error) {
            console.error(error)
        } finally {
            runInAction('create activity final', () => { this.submitting = false; });

        }
    }

    @action openCreateForm = () => {
        this.editMode = true;
        this.selectedActivity = undefined;
    }

    @action selectActivity = (id: string | null) => {
        if (id)
            this.selectedActivity = this.activityRegistry.get(id)
        else
            this.selectedActivity = undefined;
        this.editMode = false;
    }

    @action editActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.update(activity);
            runInAction('editing activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.selectedActivity = activity;
                this.editMode = false;
            });


        } catch (error) {
            console.error(error);
        } finally {
            runInAction('edit activity final', () => {
                this.submitting = false;
            });

        }
    }

    @action deleteActivity = async (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
        this.submitting = true;
        this.target = event.currentTarget.name;
        try {
            await agent.Activities.delete(id);
            runInAction('deleting activity', () => {
                this.activityRegistry.delete(id);
                this.selectedActivity = undefined;
            });


        } catch (error) {
            console.error(error);
        } finally {
            runInAction('delete activity final', () => {
                this.target = '';
                this.submitting = false;
            });
        }
    }



    @action openEditForm = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
        this.editMode = true;
    }

    @action cancelSelectedActivity = () => {
        this.selectedActivity = undefined;

    }
    @action cancelFormOpen = () => {
        this.editMode = false;

    }
}

export default createContext(new ActivityStore());