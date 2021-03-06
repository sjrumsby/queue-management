<template>
  <b-modal v-model="modalVisible"
           @shown="show"
           size="md"
           modal-class="q-modal"
           body-class="q-modal"
           no-close-on-backdrop
           no-close-on-esc
           hide-header>
      <template slot="modal-footer">
        <div class="d-flex flex-row-reverse">
          <b-button class="disabled btn-primary ml-2"
                    v-if="submitDisabled"
                    @click="validate=true">Submit</b-button>
          <b-button class="btn-primary ml-2"
                    @click="submit"
                    v-if="!submitDisabled">Submit</b-button>
          <b-button @click="cancel()">Cancel</b-button>
        </div>
      </template>
      <span v-if="this.editDeleteSeries" style="font-size:1.75rem;">Book Service Appointment Series</span>
      <span v-else style="font-size:1.75rem;">Book Service Appointment</span><br>
      <b-form autocomplete="off">
        <!--  Citizen Name and Contact Info row -->
        <b-form-row>
          <b-col cols="6">
            <b-form-group class="mb-0 mt-2">
              <label class="mb-0">Citizen Name</label><br>
              <b-form-input v-if="isNotBlackoutFlag"
                            v-model="citizen_name"/>
              <b-form-input v-else
                            v-model="citizen_name"
                            readonly/>
            </b-form-group>
          </b-col>
          <b-col cols="6">
            <b-form-group class="mb-0 mt-2">
              <label class="mb-0">Contact Info</label><br>
              <b-form-input v-if="isNotBlackoutFlag"
                            v-model="contact_information"/>
              <b-form-input v-else
                            v-model="contact_information"
                            readonly/>
            </b-form-group>
          </b-col>
        </b-form-row>
        <!--  End of Citizen Name and Contact Info row -->

        <!--  The Time and Date row. -->
        <b-form-row>
          <b-col cols="4">
            <b-form-group class="mb-0 mt-2">
              <label class="mb-0">Time</label><br>
              <b-form-input :value="displayStart"
                            disabled />
            </b-form-group>
          </b-col>
          <b-col cols="8">
            <b-form-group class="mb-0 mt-2">
              <label class="mb-0">Date</label><br>
              <b-form-input :value="displayDate"
                            disabled />
            </b-form-group>
          </b-col>
        </b-form-row>
        <!--  End of the Time and Date row. -->

        <!--  The Date/Time row -->
        <b-form-row>
          <b-col>
            <b-form-group v-if="isNotBlackoutFlag"
                          class="mb-0 mt-2">
              <label class="mb-0">Length</label><br>
              <b-select v-model="length"
                        :options="timeOptions" />
            </b-form-group>
          </b-col>
          <b-col>
            <b-form-group v-if="isNotBlackoutFlag"
                          class="mb-0 mt-2">
              <label class="mb-0">Change Date/Time</label><br>
              <b-button @click="reschedule"
                        class="btn-secondary w-100">Reschedule</b-button>
            </b-form-group>
          </b-col>
          <!--  Column to delete blackout period or series (if a clicked appointment?) -->
          <b-col v-if="clickedAppt">
            <b-form-group class="mb-0 mt-2">
              <label v-if="this.editDeleteSeries" class="mb-0">Remove Appointment</label>
              <label v-else class="mb-0">Remove Appointment</label><br>
              <b-button v-if="clickedAppt && !this.editDeleteSeries"
                        @click="deleteAppt"
                        class="btn-danger w-100">
                Delete
              </b-button>
              <b-button v-else
                        @click="deleteRecurringAppts"
                        class="btn-danger w-100">
                Delete Series
              </b-button>
            </b-form-group>
          </b-col>
        </b-form-row>
        <!--  End of the Date/Time row -->

        <!--  Service selected by the citizen row -->
        <b-form-row>
          <b-col>
            <b-form-group v-if="isNotBlackoutFlag"
                          class="mb-0 mt-2">
              <label class="mb-0">Service Required by Citizen</label><br>
              <div style="width: 100%; display: flex;">
                <b-input-group>
                  <b-input-group-prepend>
                    <b-button-group>
                      <b-button variant="primary"
                                class="px-0"
                                style="width: 52px"
                                @click="addService">{{ selectedService ? 'Edit' : 'Set' }}</b-button>
                      <b-button variant="secondary"
                                v-if="selectedService"
                                class="px-0"
                                style="width: 52px;border-radius: 0px;"
                                @click="clearService">Clear</b-button>
                    </b-button-group>
                  </b-input-group-prepend>
                  <b-form-input disabled
                                :state="validated.selectedService"
                                :value="service_name" />
                </b-input-group>

              </div>
            </b-form-group>
          </b-col>
        </b-form-row>
        <!--  End of service selected by the citizen row -->

        <!--  The Notes row. -->
        <b-form-row>
          <b-col>
            <b-form-group class="mb-0 mt-2">
              <label class="mb-0">Notes</label><br>
              <b-textarea v-model="comments"
                          rows="2"/>
            </b-form-group>
          </b-col>
        </b-form-row>
        <!--  End of the Notes row. -->

      </b-form>
      <div class="d-flex flex-row-reverse mt-2 mb-0">
        <div v-if="showMessage"
             style="color: red;"
             class="mb-0">Please complete all required fields.</div>
      </div>
  </b-modal>
</template>

<script>
  import moment from 'moment'
  import { createNamespacedHelpers } from 'vuex'
  const { mapActions, mapGetters, mapMutations, mapState } = createNamespacedHelpers('appointmentsModule')

  export default {
    name: 'ApptBookingModal',
    props: ['clickedTime', 'clickedAppt'],
    data() {
      return {
        baseEnd: null,
        booking: false,
        citizen_id: null,
        citizen_name: null,
        oldLength: null,
        comments: null,
        contact_information: null,
        fieldsEdited: false,
        length: 0,
        rescheduling: false,
        selectingService: false,
        showMessage: false,
        start: null,
        validate: false,
      }
    },
    mounted() {
      if (this.$store.state.services.length === 0) {
        this.getServices()
      }
    },
    computed: {
      ...mapGetters([
        'services',
        'appointment_events'
      ]),
      ...mapState([
        'showApptBookingModal',
        'selectedService',
        'editDeleteSeries',
      ]),
      appointments() {
        if (this.clickedAppt) {
          let appointments = Object.assign([], this.appointment_events)
          let i = this.appointment_events.indexOf(this.clickedAppt)
          appointments.splice(i,1)
          return appointments
        }
      },
      isNotBlackoutFlag(){
        if(this.clickedAppt){
          if(this.clickedAppt.blackout_flag){
            if(this.clickedAppt.blackout_flag == 'Y'){
              return false
            }else if(this.clickedAppt.blackout_flag == 'N'){
              return true
            }
          }else {
            return true
          }
        }
        return true
      },
      end() {
        if (this.clickedTime) {
          return moment(this.clickedTime.start).clone().add(this.length, 'minutes')
        }
        if (this.clickedAppt) {
          return moment(this.clickedAppt.start).clone().add(this.length, 'minutes')
        }
      },
      timeOptions() {
        let options = []
        if (this.clickedTime) {
          let event = this.clickedTime
          let time = moment(event.end).clone().diff(event.start, 'minutes')
          for (let l = 15; l <= time; l += 15) {
            options.push(l)
          }
          return options
        }
        if (this.clickedAppt) {
          let event = this.clickedAppt
          let start = moment(event.start).clone()
          for (let l of [15, 30, 45, 60]) {
            let testEnd = start.clone().add(l, 'minutes')
            if (this.appointments.find(appt => moment(appt.start).isBetween(start, testEnd))) {
              break
            }
            options.push(l)
          }
          return options
        }
      },
      service_name() {
        this.$store.commit('setDisplayServices', 'Dashboard')
        let services = this.$store.getters.filtered_services;
        if (services && services.length > 0) {
          if (this.selectedService) {
            return services.find(srv => srv.service_id === this.selectedService).service_name
          }
        }
        return 'Please choose a service'
      },
      displayDate() {
        if (this.start) {
          return new moment(this.start).clone().format('dddd MMMM Do, YYYY')
        }
        return ''
      },
      displayStart() {
        if (this.start) {
          return new moment(this.start).clone().format('h:mm a')
        }
        return ''
      },
      modalVisible: {
        get() { return this.showApptBookingModal },
        set(e) { this.toggleApptBookingModal(e) }
      },
      submitDisabled() {
        if (this.citizen_name && this.selectedService ) {
          return false
        }
        return true
      },
      validated() {
        let output = {}
        if (!this.citizen_name) {
          output.citizen_name = false
        }
        if (!this.selectedService) {
          output.selectedService = false
        }
        if (this.validate && Object.keys(output).length > 0) {
          this.showMessage = true
          return output
        }
        this.showMessage = false
        return {
          citizen_name: null,
          selectedService: null
        }
      }
    },
    methods: {
      ...mapActions([
        'clearAddModal',
        'deleteAppointment',
        'deleteRecurringAppointments',
        'getAppointments',
        'getServices',
        'postAppointment',
        'putAppointment',
        'putRecurringAppointment',
        'resetAddModalForm',
        'toggleAddModal',
      ]),
      ...mapMutations([
        'setEditedStatus',
        'setSelectedService',
        'setRescheduling',
        'toggleApptBookingModal',
        'toggleEditDeleteSeries',
      ]),
      addService() {
        this.selectingService = true
        this.clearMessage()
        this.toggleApptBookingModal(false)
        this.toggleAddModal(true)
        if (this.selectedService) {
          this.$store.commit('updateAddModalForm', {type:'service', value:this.selectedService})
          return
        }
        this.clearService()
      },
      clearEvents() {
        this.$root.$emit('clear-clicked-time')
        if (!this.rescheduling && !this.selectingService) {
          this.$root.$emit('clear-clicked-appt')
        }
      },
      clearMessage() {
        this.validate = false
        this.showMessage = false
      },
      clearService() {
        this.clearMessage()
        this.clearAddModal()
        this.resetAddModalForm()
      },
      deleteAppt() {
        this.deleteAppointment(this.clickedAppt.appointment_id).then( () => {
          this.cancel()
        })
      },
      deleteRecurringAppts() {
        this.deleteRecurringAppointments(this.clickedAppt.recurring_uuid).then( () => {
          this.cancel()
        })
      },
      reschedule() {
        if (this.clickedTime) {
          this.$root.$emit('removeTempEvent')
        }
        this.rescheduling = true
        this.clearMessage()
        this.oldLength = this.length
        this.toggleApptBookingModal(false)
      },
      cancel() {
        this.$root.$emit('removeTempEvent')
        this.$root.$emit('clear-clicked-time')
        this.$root.$emit('clear-clicked-appt')
        this.toggleApptBookingModal(false)
      },
      show() {
        this.clearMessage()
        if (this.selectingService) {
          this.selectingService = false
          return
        }
        if (this.rescheduling) {
          this.rescheduling = false
          this.start = this.clickedTime.start.clone()
          this.length = this.clickedTime.end.clone().diff(this.start, 'minutes')
          if (this.oldLength) {
            if (this.oldLength < this.length) {
              this.length = this.oldLength
            }
            this.oldLength = null
          }
          return
        }
        if (this.clickedTime) {
          this.citizen_name =
          this.comments = null
          this.contact_information = null
          this.length = 15
          this.start = this.clickedTime.start.clone()
          this.clearAddModal()
        }
        if (this.clickedAppt && this.clickedAppt.end) {
          this.citizen_name = this.clickedAppt.title
          this.comments = this.clickedAppt.comments
          this.contact_information = this.clickedAppt.contact_information
          this.start = this.clickedAppt.start.clone()
          this.length = this.clickedAppt.end.clone().diff(this.start, 'minutes')
          let { service_id } = this.clickedAppt
          this.setSelectedService(service_id)
          this.$store.commit('updateAddModalForm', {type: 'service', value: service_id})
        }else {
          this.citizen_name = ''
          this.comments = ''
          this.contact_information = ''
          this.start = this.clickedTime.start.clone()
        }
      },
      submit() {
        this.clearMessage()
        let service_id = this.selectedService
        let start = moment(this.start).clone()
        let end = moment(this.end).clone()
        let e = {
          start_time: moment.utc(start).format(),
          end_time: moment.utc(end).format(),
          service_id,
          citizen_name: this.citizen_name,
          contact_information: this.contact_information,
        }
        if (this.comments) {
          e.comments = this.comments
        }
        let finish = () => {
          this.cancel()
          this.$root.$emit('clear-clicked-appt')
          this.$root.$emit('clear-clicked-time')
        }
        if (this.clickedAppt) {
          let payload = {
            id: this.clickedAppt.appointment_id,
            data: e
          }
          if(this.editDeleteSeries === true){
            // IFF further fields are added to the appointment model that are intended to be edited,
            // and they belong to blackouts, and them to the following object below. Ensure that dates are
            // not included as all events in this series will be under the start/end time of the event
            // that is clicked in the calendar
            this.toggleEditDeleteSeries(false)
            let re_e = {
              comments: this.comments
            }
            let re_payload = {
              id: this.clickedAppt.appointment_id,
              data: re_e,
              recurring_uuid: this.clickedAppt.recurring_uuid
            }
            this.putRecurringAppointment(re_payload).then(() => {
              this.getAppointments().then( () => {
                finish()
              })
            })
          }else {
            this.putAppointment(payload).then( () => {
              this.getAppointments().then( () => {
                finish()
              })
            })
          }
          return
        }
        this.postAppointment(e).then( () => {
          this.getAppointments().then( () => {
            finish()
          })
        })
      },
    },
  }
</script>
