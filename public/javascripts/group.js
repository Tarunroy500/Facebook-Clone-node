// const { use } = require("../../routes");

$(".addMember").click(function () {
  var id = $(this).attr("data-id");
  var limit = $(this).attr("data-limit");

  $("#group_id").val(id);
  $("#limit").val(limit);

  $.ajax({
    url: "/get-members",
    type: "POST",
    data: { group_id: id },
    success: function (res) {
      console.log(res);
      if (res.success == true) {
        let users = res.data;
        console.log(users);
        let html = '';
        for (let i = 0; i < users.length; i++) {
          let isMemberOfGroup = users[i]['member'].length > 0?true:false;
          html +=
            `<tr> 
                <td>
                    <input type="checkbox"`+(isMemberOfGroup?'checked':'')+` name="members" value="`+users[i]["_id"]+`"/>
                </td>
                <td>` +
            users[i]["first_name"] +
            `</td>
            </tr>`;
        }
        $(".addMembersInTable").html(html);
      } else {
        alert(res.msg);
      }
    }
  });
});

$("#add-member-form").submit(function (event) {
  event.preventDefault();
  var formData = $(this).serialize();
  $.ajax({
    url: "/add-members",
    type: "POST",
    data: formData,
    success: function (res) {
      console.log(res);
        if(res.success == true){
            $('#memberModal').modal('hide')
            $('#add-member-form')[0].reset();
            alert(res.msg);
        }else{
            $('#add-member-error').text(res.msg)
            setTimeout(()=>{
                $('#add-member-error').text('')
            },3000)
        }
    }
  });
});
