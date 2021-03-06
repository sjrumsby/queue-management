'''Copyright 2018 Province of British Columbia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.'''

from marshmallow import fields
import toastedmarshmallow
from app.models.bookings import Booking
from app.schemas.bookings import RoomSchema, InvigilatorSchema
from app.schemas.theq import OfficeSchema
from qsystem import ma


class BookingSchema(ma.ModelSchema):

    class Meta:
        model = Booking
        jit = toastedmarshmallow.Jit

    booking_id = fields.Int(dump_only=True)
    booking_name = fields.Str()
    end_time = fields.DateTime()
    fees = fields.Str()
    room_id = fields.Int()
    start_time = fields.DateTime()
    shadow_invigilator_id = fields.Int(allow_none=True)
    office_id = fields.Int()
    sbc_staff_invigilated = fields.Int()
    booking_contact_information = fields.Str()
    blackout_flag = fields.Str(allow_none=True)
    blackout_notes = fields.Str(allow_none=True)
    recurring_uuid = fields.Str(allow_none=True)

    room = fields.Nested(RoomSchema(exclude=("booking", "office",)))
    office = fields.Nested(OfficeSchema(only=('appointments_enabled_ind', 'exams_enabled_ind', 'office_id',
                                              'office_name', 'office_number', 'timezone')))
