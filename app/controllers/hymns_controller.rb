class HymnsController < ApplicationController
  def index
    render :show
  end

  def show
  end

  def data
    @hymn_id = params[:hymn_id] || "hymn_00"
    @hymn_id = "hymn_00" if !Uta::HYMNS.keys.include? @hymn_id.to_sym
    @hymn = Uta.get(@hymn_id)
    render layout: false
  end
end
