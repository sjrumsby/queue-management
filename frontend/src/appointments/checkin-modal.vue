<template>
  <b-modal v-model="modalVisible"
           @shown="clearTime"
           modal-class="q-modal"
           body-class="q-modal"
           no-close-on-backdrop
           no-close-on-esc
           hide-header
           size="sm">
    <template slot="modal-footer">
      <b-button class="btn-secondary"
                @click="hide">Close</b-button>
    </template>
    <b-form autocomplete="off">
      <b-form-row>
        <b-col>
          <b-form-group v-if="isNotBlackoutFlag"
                        class="mb-0 mt-2">
            <label class="mb-0">Citizen Has Arrived?</label><br>
            <b-button class="w-100 btn-success"
                      @click="checkIn">
              Check-In
            </b-button>
          </b-form-group>
        </b-col>
      </b-form-row>
      <b-form-row>
        <b-col>
          <b-form-group class="mb-0 mt-2">
            <label class="mb-0">Edit or Cancel Appointment?</label><br>
            <b-button class="w-100 btn-secondary"
                      @click="editAppt">
              Edit Appointment
            </b-button>
          </b-form-group>
        </b-col>
      </b-form-row>
      <b-form-row v-if="checkRecurringStatus">
        <b-col>
          <b-form-group class="mb-0 mt-2">
            <label class="mb-0">Edit or Cancel Recurring Series?</label><br>
            <b-button class="w-100 btn-secondary"
                      @click="editSeries">
              Edit Recurring Series
            </b-button>
          </b-form-group>
        </b-col>
      </b-form-row>
    </b-form>
  </b-modal>
</template>

<script>
  import moment from 'moment'
  import { createNamespacedHelpers } from 'vuex'
  const { mapActions, mapGetters, mapMutations, mapState } = createNamespacedHelpers('appointmentsModule')

  export default {
    name: "CheckInModal",
    props: ['clickedAppt'],
    computed: {
      ...mapState(['showCheckInModal']),
      modalVisible: {
        get() { return this.showCheckInModal },
        set(e) { this.toggleCheckInModal(e) }
      },
      isNotBlackoutFlag(){
        if(this.clickedAppt && this.clickedAppt.blackout_flag){
          if(this.clickedAppt.blackout_flag === 'Y'){
            return false
          } else if (this.clickedAppt.blackout_flag === 'N') {
            return true
          }
        }
        return false
      },
      checkRecurringStatus() {
        if(this.clickedAppt && this.clickedAppt.recurring_uuid === null) {
          return false
        }
        return true
      },
    },
    methods: {
      ...mapActions([
        'getAppointments',
        'postCheckIn'
      ]),
      ...mapMutations([
        'toggleCheckInModal',
        'toggleApptBookingModal',
        'toggleEditDeleteSeries',
      ]),
      checkIn() {
        this.postCheckIn(this.clickedAppt).then( () => {
          this.hide()
        })
      },
      clearTime() {
        this.$root.$emit('cleardate')
      },
      hide() {
        this.getAppointments().then( () => {
          this.toggleCheckInModal(false)
        })
      },
      editAppt() {
        this.toggleApptBookingModal(true)
        this.toggleCheckInModal(false)
        this.toggleEditDeleteSeries(false)
        this.getAppointments()
      },
      editSeries() {
        this.toggleApptBookingModal(true)
        this.toggleCheckInModal(false)
        this.toggleEditDeleteSeries(true)
        this.getAppointments()
      },
    }
  }
</script>

<style scoped>

</style>
