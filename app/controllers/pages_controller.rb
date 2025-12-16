class PagesController < ApplicationController
  def home
    aux = JSON.parse(cookies[:config] || "{}", symbolize_names: true)
    @config = {}
    @config[:hymn_id] = aux[:hymn_id] || "hymn_00"
    @config[:font_size] = aux[:font_size] || 16
    @config[:space_width] = aux[:space_width] || 1.3
    @config[:bpm_time] = aux[:bpm_time] || 60
    @config[:animation] = aux[:animation].to_s != "false"
    @config[:visible_instruments] = aux[:visible_instruments] || []
    @config[:suwari_configuration] = aux[:suwari_configuration] || [ 21, 3, 3 ]
  end

  private

  def set_hymn
    @config[:hymn_id] = params.expect(:id)
    cookies.permanent[:config] = @config.to_json
  end
end
