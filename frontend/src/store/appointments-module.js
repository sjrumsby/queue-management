import { Axios } from './helpers'
import moment from 'moment'

export default {
  editing: false,
  rescheduling: false,
  namespaced: true,
  state: {
    appointments: [],
    calendarSetup: {
      title: null,
      name: null
    },
    editDeleteSeries: false,
    selectedService: null,
    showApptBookingModal: false,
    showAppointmentBlackoutModal: false,
    showCheckInModal: false,
    services: [],
  },
  getters: {
    service_name: (state, getters, rootState) => {
      if (rootState.services && rootState.services.length > 0) {
        if (state.selectedService) {
          let { services } = rootState
          return services.find(srv => srv.service_id === state.selectedService).service_name
        }
      }
      return 'Please choose a service'
    },

    appointment_events(state) {
      if (state.appointments.length > 0) {
        return state.appointments.map(apt =>
          ({
            start: apt.start_time,
            end: apt.end_time,
            appointment_id: apt.appointment_id,
            service_id: parseInt(apt.service_id),
            citizen_id: apt.citizen_id,
            title: apt.citizen_name,
            contact_information: apt.contact_information,
            comments: apt.comments,
            color: '#B5E0B8',
            blackout_flag: apt.blackout_flag,
            recurring_uuid: apt.recurring_uuid,
          })
        )
      }
      return []
    },
    calendar_setup(state) {
      if ((state.calendarSetup || {}).name) {
        let { title, name } = state.calendarSetup
        return {
          name,
          title
        }
      }
      return {
        name: 'agendaWeek',
        title: 'Appointments'
      }
    },
    services(state, getters, rootState) {
      if (rootState.services) {
        return rootState.services
      }
      return []
    },
    is_GA(state, getters, rootState){
      if(rootState.user && rootState.user.role && rootState.user.role.role_code === 'GA'){
        return true
      }
      return false
    },
    is_recurring_enabled(state, getters, rootState) {
      if(rootState.recurringFeatureFlag === 'On'){
        return true
      }
      return false
    }
  },
  actions: {
    clearAddModal({commit}) {
      commit('updateAddModalForm', { type: 'search', value: null}, {root: true})
      commit('setSelectedService', null)
    },
  
    deleteAppointment({dispatch, rootState}, payload) {
      let state = rootState
      return new Promise((resolve, reject) => {
        Axios({state}).delete(`/appointments/${payload}/`).then( () => {
          dispatch('getAppointments').then( () => {
            resolve()
          })
        })
      })
    },

    deleteRecurringAppointments({dispatch, rootState}, payload) {
      let state = rootState
      return new Promise((resolve, reject) => {
        Axios({state}).delete(`/appointments/recurring/${payload}`).then( () => {
          dispatch('getAppointments').then( () => {
            resolve()
          })
        })
      })
    },
  
    getAppointments({commit, rootState}) {
      let state = rootState
      let output = []
      return new Promise((resolve, reject) => {
        Axios({state}).get('/appointments/').then( resp => {
          let appts = resp.data.appointments
          if (appts.length > 0) {
            output = appts.filter(ap => !ap.checked_in_time)
          }
          commit('setAppointments', output)
          resolve()
        })
      })
    },
    
    getChannels({dispatch}) {
      dispatch('getChannels', null, {root: true})
    },
    
    getServices({dispatch, commit}) {
      dispatch('getServices', null, {root: true})
      dispatch('getCategories', null, {root: true})
      dispatch('getChannels', null, {root: true})
    },
    
    postAddToQueue({rootState}, payload) {
      let state = rootState
      return new Promise((resolve, reject) => {
        let url = `/citizens/${payload}/add_to_queue/`
        Axios({state}).post(url,{}).then(resp=>{
          resolve(resp)
        }, error => {
          reject(error)
        })
      })
    },
  
    postAppointment({rootState}, payload) {
      let state = rootState
      payload.office_id = rootState.user.office_id
      return new Promise((resolve, reject) => {
        Axios({state}).post('/appointments/', payload).then( resp => {
          resolve(resp)
        })
      })
    },
    
    postCheckIn({ dispatch, rootState }, payload) {
      let state = rootState
      let data = {
        checked_in_time: moment.utc().format(),
        appointment_id: payload.appointment_id,
        service_id: payload.service_id,
        citizen_name: payload.title,
      }
      payload.start_time = data.checked_in_time
      payload.snowplow_addcitizen = true
      return new Promise((resolve, reject) => {
        Axios({state}).put(`/appointments/${payload.appointment_id}/`, data).then( () => {
          dispatch('sendToQueue', payload)
        })
      })
    },
    
    postServiceReq({rootState}, {citizen_id, payload}) {
      let state = rootState
      let { channel_id } = rootState.channels.find(ch => ch.channel_name.includes('Person'))
      let service_request = {
        channel_id,
        citizen_id,
        priority: 1,
        quantity: 1,
        service_id: payload.service_id,
      }
      return new Promise((resolve, reject) => {
        let url = `/service_requests/`
        Axios({state}).post(url, {service_request}).then(resp=>{
          resolve(resp)
        }, error => {
          reject(error)
        })
      })
    },
  
    putAppointment({dispatch, rootState}, payload) {
      let state = rootState
      let { id } = payload
      return new Promise((resolve, reject) => {
        Axios({state}).put(`/appointments/${id}/`, payload.data).then( resp => {
          dispatch('getAppointments')
          resolve()
        })
      })
    },

    putRecurringAppointment({dispatch, rootState}, payload){
      let state = rootState
      let uuid = payload.recurring_uuid
      console.log('PUT DATA', payload)
      return new Promise((resolve, reject) => {
        Axios({state}).put(`/appointments/recurring/${uuid}`, payload.data).then( resp => {
          dispatch('getAppointments')
          resolve()
        })
      })
    },
    
    putCitizen({rootState}, {citizen_id, payload}) {
      let start = moment(payload.start).clone().format('h:mm')
      if (!payload.comments) {
        payload.comments = ''
      }
      if (!payload.snowplow_addcitizen) {
        payload.snowplow_addcitizen = false
      }
      let data = {
        priority: 1,
        citizen_comments: `${start}|||${payload.comments}`,
        citizen_name: payload.title,
        start_time: payload.start_time,
        snowplow_addcitizen: payload.snowplow_addcitizen
      }
      
      return new Promise((resolve, reject) => {
        let state = rootState
        let url = `/citizens/${citizen_id}/`
        Axios({state}).put(url, data).then(resp => {
          resolve(resp)
        }, error => {
          reject(error)
        })
      })
    },
    
    resetAddModalForm({commit}) {
      commit('resetAddModalForm', null, {root: true})
    },

    sendToQueue({dispatch, commit, rootState}, payload) {
      let citizen_id = payload.citizen_id
      commit('setAppointmentsStateInfo', payload, { root: true })
      dispatch('putCitizen', {citizen_id, payload}).then( () => {
        dispatch('postServiceReq', {citizen_id, payload}).then( () => {
          dispatch('postAddToQueue', citizen_id).then( () => {
            dispatch('getAppointments').then( () => {
              commit('toggleCheckInModal', false)
            })
          })
        })
      })
    },

    toggleAddModal({commit}, payload) {
      commit('toggleAddModal', payload, {root: true})
      if (payload) {
        commit('switchAddModalMode', 'add_mode', {root: true})
      }
    },
  },
  mutations: {
    setEditedStatus: (state, payload) => state.editing = payload,
    setAppointments: (state, payload) => state.appointments = payload,
    setCalendarSetup: (state, payload) => {
      let { title, name } = payload
      state.calendarSetup = { title, name }
    },
    toggleApptBookingModal: (state, payload) => state.showApptBookingModal = payload,
    toggleCheckInModal: (state, payload) => state.showCheckInModal = payload,
    toggleEditDeleteSeries: (state, payload) => state.editDeleteSeries = payload,
    setSelectedService: (state, payload) => {
      state.selectedService = null
      state.selectedService = payload
    },
    setRescheduling: (state, payload) => state.reschedulinng = payload,
    toggleAppointmentBlackoutModal: (state, payload) => state.showAppointmentBlackoutModal = payload,
  },
}
