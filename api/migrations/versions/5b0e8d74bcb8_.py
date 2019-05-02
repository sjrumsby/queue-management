"""empty message

Revision ID: 5b0e8d74bcb8
Revises: c6e752f35c56
Create Date: 2019-04-16 14:16:01.939275

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5b0e8d74bcb8'
down_revision = 'c6e752f35c56'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('examtype', sa.Column('pesticide_exam_ind', sa.Integer(), nullable=False))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('examtype', 'pesticide_exam_ind')
    # ### end Alembic commands ###
