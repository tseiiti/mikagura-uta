module PagesHelper
  def hymn_html(hymn, &block)
    song = hymn[:song]
    @first = true

    tag.main data: { controller: "uta", uta_id: 1 }, class: "container-lg my-4" do
      content = tag.h1 hymn[:title]
      song.each_with_index do |paragraph, i|
        content += paragraph_html(paragraph, i)
      end
      content.html_safe
    end
  end

  def paragraph_html(paragraph, i)
    tag.div class: "paragraph paragraph_#{ i }" do
      content = ""
      paragraph.each_with_index do |line, j|
        content += line_html(line, j, i)
      end
      content.html_safe
    end
  end

  def line_html(line, j, i)
    lyric = (line[:lyric] || "").gsub(/\s+/, "")
    tag.div class: "line line_#{ j } #{ 'pause' if line[:pause] }" do
      content = tag.div class: "syllable d-none d-md-block" do
        clas = "beat first-beat #{ @first ? 'd-none' : '' }"
        data = { paragraph: i, line: j, syllable: -1, part: 1 }
        content = tag.progress class: clas, data: data, value: 0, max: 5

        if @first
          content += first_span_html(j, i)
          @first = line[:pause]
        end

        content.html_safe
      end

      i1 = 0
      i2 = 0
      while lyric.size > 0
        lyric, text = syllable_text(lyric)
        return if text.blank?

        stop = line[:stop] == i1
        classes = [
          [
            "part_#{ line[:inverse] ? '2' : '1' } #{ 'stop' if stop }".strip,
            stop ? nil : "beat beat_#{ i2 + 1 }",
            { paragraph: i, line: j, syllable: i2 / 2, part: 1 }
          ], [
            "part_#{ line[:inverse] ? '1' : '2' } #{ 'd-none' if stop }".strip,
            "beat beat_#{ i2 + 1 }",
            { paragraph: i, line: j, syllable: i2 / 2, part: 2 }
          ]
        ]

        content += tag.div class: "syllable syllable_#{ i2 / 2 }" do
          content = syllable_part_html(text, classes[0])
          if line[:halfs]&.include? i1 + 1
            lyric, text = syllable_text(lyric)
            content += syllable_part_html(text, classes[1])
            i1 += 1
          else
            content += syllable_part_html("", classes[1])
          end
          i1 += 1
          i2 += 2
          content.html_safe
        end

        content.html_safe
      end

      content.html_safe
    end
  end

  def syllable_part_html(text, classes)
    text = "" if text == "_"
    text = "xi" if text == "i"
    text = "xo" if text == "o"
    tag.span class: "part #{ classes[0] }" do
      content  = tag.progress class: classes[1], data: classes[2], value: 0, max: 5
      content += tag.div text, class: "part_text"
    end
  end

  def first_span_html(j, i)
    tag.span class: "first-span paragraph_#{ i } line_#{ j }" do
      content  = tag.span "."
      content += tag.span "."
      content += tag.span "."
      content.html_safe
    end
  end

  def syllable_text(lyric)
    text = nil
    Uta::SEARCHES.each do |s|
      r = Regexp.new("^#{ s }")
      if r.match? lyric
        text = s
        lyric = lyric.gsub(r, "")
        break
      end
    end
    [ lyric, text ]
  end
end
