require "test_helper"

class HymnsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get hymns_index_url
    assert_response :success
  end
end
