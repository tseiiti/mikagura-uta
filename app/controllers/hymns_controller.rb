class HymnsController < ApplicationController
  def index
  end

  def data
    hymn_id = params[:hymn_id] || "hymn_00"
    hymn_id = "hymn_00" if !Uta::HYMNS.keys.include? hymn_id.to_sym
    render html: helpers.hymn_html(Uta.get(hymn_id)), layout: false
  end
end
