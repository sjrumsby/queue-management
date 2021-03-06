/*Copyright 2015 Province of British Columbia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

<template>
<div style="width: 100%; height: 100%;">
  <div style="display: flex; height: 75%; width: 100%;">
    <div class="board-85-video">
      <div class="board-video-div">
        <Video :office_number="smartboardData.office_number" />
      </div>
    </div>
    <div class="board-25-table">
      <div class="board-content-div">
        <b-table :items="items"
                 :fields="fields"
                 :small="longlist"
                 thead-tr-class="testclass"
                 v-bind:thead-class="headclass"
                 v-bind:tbody-class="bodyclass">
          <template slot="ticket_number" slot-scope="data">
            <div v-if="highlighted.includes(data.value)" class="flashing-ticket">
              {{data.value}}
            </div>
            <div v-else>
              {{data.value}}
              {{data.item._rowVariant=''}}
            </div>
          </template>
          <template slot="overflow" slot-scope="data">
            {{ this.showOverflow === false ?
              data.item._tdClass = 'd-none': data.item._tdClass = ''}}
              {{ this.showOverflow === false ?
                data.item._thClass = 'd-none': data.item._thClass = ''}}
            <div v-if="highlighted.includes(data.value)" class="flashing-ticket">
              {{data.value}}
            </div>
            <div v-else>
              {{data.value}}
              {{data.item._rowVariant=''}}
            </div>
          </template>
        </b-table>
        <div v-if="networkStatus.networkDown" class="loading small"><div></div><div></div><div></div><div></div><div></div></div>
      </div>
    </div>
  </div>
  <div v-if="!networkStatus.networkDown" class="bottom-flex-div">
      <div class="flex-title"> Currently waiting: {{waiting}}</div>
    </div>
</div>
</template>

<script>
import axios from 'axios'
import Video from './video'

const Axios = axios.create({
  baseURL: process.env.API_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json'
  }
})

export default {
  name: 'CallByTicket',
  mounted() {
    this.$root.$on('addToBoard',() => { this.updateBoard() })
    this.initializeBoard()
  },
  props: ['smartboardData', 'networkStatus'],
  components: { Video },
  data() {
    return {
      highlighted: [],
      fields: [
        {key: 'ticket_number', label: 'Now Calling', tdClass:'text-center'},
        {key: 'overflow', label:'', tdClass: 'd-none', thClass: 'd-none'}
      ],
      citizens: '',
      intervals: {},
      overflow: [],
      showOverflow: false,
      overflowStyle: 'd-none'
    }
  },
  computed: {
    items() {
      if (this.showOverflow === true) {
        let base = this.invited
        this.overflow.forEach( (c,i) => {
          base[i].overflow = c.ticket_number
        })
        return base
      } else {
        return this.invited
      }
    },
    longlist() {
      if (this.invited.length > 6) {
        return true
      }
      return false
    },
    headclass() {
      if (this.longList) {
        return 'sm-boardtable-head'
      }
      return 'lg-boardtable-head'
    },
    bodyclass() {
      if (this.longList) {
        return 'sm-boardtable-body pr-3'
      }
      return 'lg-boardtable-body pr-3'
    },
    url() {
      return `/smartboard/?office_number=${this.smartboardData.office_number}`
    },
    invited() {
      if (this.citizens && this.citizens.length > 0) {
        let citizens = this.citizens.filter(c=>c.active_period.ps.ps_name === 'Invited')
        let invited = null
        if (citizens.length > 8) {
          this.overflow = citizens.slice(8, (citizens.length-1))
          this.showOverflow = true
          invited = citizens.slice(0,8)
        } else {
          this.overflow = []
          this.showOverflow = false
          invited = citizens
        }
        if (invited.length != 0) {
          let tickets = []
          invited.forEach(item => tickets.push({ticket_number: item.ticket_number}))
          return tickets
        }
      }
      return [{ticket_number:''}]
    },
    waiting() {
      if (this.citizens && this.citizens.length > 0) {
        return this.citizens.filter(c=>c.active_period.ps.ps_name === 'Waiting').length
      }
      return 0
    },
    date() {
      let d = new Date()
      return d.toLocaleDateString('en-CA', this.options)
    },

  },
  methods: {
    initializeBoard() {
      Axios.get(this.url).then( resp => {
        this.citizens = resp.data.citizens
        this.$root.$emit('boardConnect', this.office_id)
      })
    },
    updateBoard() {
      Axios.get(this.url).then( resp => {
        this.citizens = resp.data.citizens
      })
    }
  }
}
</script>



